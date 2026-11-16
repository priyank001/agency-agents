import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, getCatalogEntry } from '../../src/domain/catalog.js';
import { IntegrationService } from '../../src/domain/integrations.js';
import { Store } from '../../src/lib/store.js';
import { createSecretBox } from '../../src/lib/crypto.js';
import { ValidationError } from '../../src/lib/validate.js';

const REQUIRED_TOOLS = ['jenkins', 'github', 'gitlab', 'bitbucket', 'git', 'maven', 'gradle', 'npm', 'pypi', 'docker-registry',
  'kubernetes', 'helm', 'terraform', 'ansible', 'sonarqube', 'trivy', 'junit', 'cypress', 'k6', 'postman',
  'prometheus', 'grafana', 'slack', 'pagerduty', 'vault', 'argocd'];

const make = () => {
  const store = new Store();
  const svc = new IntegrationService({ store, secretBox: createSecretBox('k'.repeat(40)) });
  return { store, svc };
};

test('catalog covers every DevOps tool family the product promises', () => {
  const types = CATALOG.map((c) => c.type);
  for (const t of REQUIRED_TOOLS) assert.ok(types.includes(t), `missing ${t}`);
  assert.equal(new Set(types).size, types.length, 'types unique');
  for (const c of CATALOG) {
    assert.ok(c.name && c.category && c.description && Array.isArray(c.fields), c.type);
    for (const f of c.fields) assert.ok(['text', 'url', 'secret', 'select'].includes(f.type), `${c.type}.${f.key}`);
  }
  assert.equal(getCatalogEntry('nope'), null);
});

test('create validates config against the catalog schema', () => {
  const { svc } = make();
  assert.throws(() => svc.create('o1', { type: 'jenkins', name: 'CI', config: { url: 'not a url' } }), ValidationError);
  assert.throws(() => svc.create('o1', { type: 'unknown-tool', name: 'x', config: {} }), ValidationError);
});

test('secrets are encrypted at rest and masked on read', () => {
  const { svc, store } = make();
  const created = svc.create('o1', { type: 'jenkins', name: 'Main CI', config: { url: 'https://ci.acme.io', username: 'bot', apiToken: 'tok-SECRET-9876' } });
  assert.equal(created.config.apiToken, '••••9876');
  const raw = store.get('integrations', created.id);
  assert.ok(!JSON.stringify(raw).includes('tok-SECRET-9876'), 'plaintext secret stored!');
  assert.equal(svc.revealSecret('o1', created.id, 'apiToken'), 'tok-SECRET-9876');
  assert.equal(svc.list('o2').length, 0, 'tenant isolation');
});

test('short secrets are fully masked', () => {
  const { svc } = make();
  const c = svc.create('o1', { type: 'slack', name: 'alerts', config: { webhookUrl: 'https://hooks.slack.com/services/T/B/x', channel: '#ops' } });
  assert.ok(!c.config.webhookUrl.includes('hooks.slack.com/services/T/B/x'));
});

test('testConnection runs offline checks and records status', async () => {
  const { svc } = make();
  const ok = svc.create('o1', { type: 'kubernetes', name: 'prod-cluster', config: { apiServer: 'https://k8s.acme.io:6443', namespace: 'shop', token: 'abcdefghijklmnop' } });
  const res = await svc.testConnection('o1', ok.id);
  assert.equal(res.ok, true);
  assert.ok(res.checks.length >= 2);
  assert.equal(svc.get('o1', ok.id).status, 'connected');
  const bad = svc.create('o1', { type: 'jenkins', name: 'plain', config: { url: 'http://ci.acme.io', username: 'u', apiToken: 'abc' } });
  const r2 = await svc.testConnection('o1', bad.id);
  assert.equal(r2.ok, false, 'plain-http + tiny token should fail checks');
  assert.equal(svc.get('o1', bad.id).status, 'error');
});

test('testConnection uses an injectable live prober when provided (and never for private addresses)', async () => {
  const store = new Store();
  const calls = [];
  const svc = new IntegrationService({ store, secretBox: createSecretBox('k'.repeat(40)), prober: async (url) => { calls.push(url); return { ok: true, status: 200 }; } });
  const a = svc.create('o1', { type: 'grafana', name: 'g', config: { url: 'https://grafana.acme.io', apiKey: 'glsa_123456789' } });
  await svc.testConnection('o1', a.id);
  assert.deepEqual(calls, ['https://grafana.acme.io']);
  const b = svc.create('o1', { type: 'grafana', name: 'meta', config: { url: 'https://169.254.169.254', apiKey: 'glsa_123456789' } });
  const r = await svc.testConnection('o1', b.id);
  assert.equal(calls.length, 1, 'must not probe link-local/metadata addresses');
  assert.equal(r.ok, false);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/lib/store.js';
import { EventBus } from '../../src/lib/events.js';
import { PipelineService, STAGES } from '../../src/domain/pipelines.js';

function setup({ executor, ...opts } = {}) {
  const store = new Store();
  const bus = new EventBus();
  const app = store.insert('apps', { orgId: 'o1', name: 'Shop', slug: 'shop', language: 'node', buildTool: 'npm', strategy: 'canary', environmentIds: ['e1'], currentVersions: {} });
  const env = store.insert('environments', { orgId: 'o1', name: 'Prod', tier: 'production', runtime: 'kubernetes', hosting: 'cloud' });
  const svc = new PipelineService({ store, bus, stageDelayMs: 0, executor, ...opts });
  return { store, bus, svc, app, env };
}

test('happy path: all stages pass, version recorded, deployment stored', async () => {
  const { svc, app, env, store } = setup();
  const run = svc.start('o1', app.id, { environmentId: env.id, trigger: 'tester' });
  assert.equal(run.status, 'queued');
  assert.deepEqual(run.stages.map((s) => s.key), STAGES.map((s) => s.key));
  const done = await svc.waitFor(run.id);
  assert.equal(done.status, 'succeeded', JSON.stringify(done.stages.map((s) => [s.key, s.status])));
  assert.ok(done.stages.every((s) => s.status === 'passed'));
  assert.ok(done.stages.every((s) => s.logs.length > 0));
  assert.equal(store.get('apps', app.id).currentVersions[env.id], done.version);
  assert.equal(store.list('deployments', { orgId: 'o1' }).length, 1);
  assert.ok(done.durationMs >= 0);
});

test('versions auto-increment per app', async () => {
  const { svc, app, env } = setup();
  const r1 = await svc.waitFor(svc.start('o1', app.id, { environmentId: env.id }).id);
  const r2 = await svc.waitFor(svc.start('o1', app.id, { environmentId: env.id }).id);
  assert.equal(r1.version, 'v1');
  assert.equal(r2.version, 'v2');
});

test('failing test stage stops the pipeline, later stages skipped, nothing deployed', async () => {
  const { svc, app, env, store } = setup({ executor: async (stage) => (stage.key === 'unit-tests' ? { ok: false, logs: [{ level: 'error', msg: '3 tests failed' }] } : { ok: true, logs: [{ level: 'info', msg: 'ok' }] }) });
  const done = await svc.waitFor(svc.start('o1', app.id, { environmentId: env.id }).id);
  assert.equal(done.status, 'failed');
  const byKey = Object.fromEntries(done.stages.map((s) => [s.key, s.status]));
  assert.equal(byKey['unit-tests'], 'failed');
  assert.equal(byKey.deploy, 'skipped');
  assert.equal(store.get('apps', app.id).currentVersions[env.id], undefined);
  assert.match(done.summary, /tests/i);
});

test('failed verification after deploy triggers automatic rollback to previous version', async () => {
  let failVerify = false;
  const { svc, app, env, store } = setup({ executor: async (stage) => ({ ok: !(failVerify && stage.key === 'verify'), logs: [{ level: 'info', msg: stage.key }] }) });
  const good = await svc.waitFor(svc.start('o1', app.id, { environmentId: env.id }).id);
  failVerify = true;
  const bad = await svc.waitFor(svc.start('o1', app.id, { environmentId: env.id }).id);
  assert.equal(bad.status, 'rolled_back');
  assert.equal(store.get('apps', app.id).currentVersions[env.id], good.version, 'traffic back on last good version');
  assert.match(bad.summary, /rolled back/i);
});

test('executor exceptions and timeouts are contained as stage failures', async () => {
  const { svc, app, env } = setup({ stageTimeoutMs: 30, executor: async (stage) => {
    if (stage.key === 'build') throw new Error('boom');
    return { ok: true, logs: [] };
  } });
  const d1 = await svc.waitFor(svc.start('o1', app.id, { environmentId: env.id }).id);
  assert.equal(d1.status, 'failed');
  assert.ok(d1.stages.find((s) => s.key === 'build').logs.some((l) => /boom/.test(l.msg)));

  const s2 = setup({ stageTimeoutMs: 30, executor: (stage) => (stage.key === 'checkout' ? new Promise(() => {}) : Promise.resolve({ ok: true, logs: [] })) });
  const d2 = await s2.svc.waitFor(s2.svc.start('o1', s2.app.id, { environmentId: s2.env.id }).id);
  assert.equal(d2.status, 'failed');
  assert.ok(d2.stages[0].logs.some((l) => /timed out/i.test(l.msg)));
});

test('only one active release per app+environment (409), different env allowed', async () => {
  const { svc, app, env, store } = setup({ stageDelayMs: 5 });
  const env2 = store.insert('environments', { orgId: 'o1', name: 'Staging', tier: 'staging', runtime: 'docker', hosting: 'on-prem' });
  store.update('apps', app.id, { environmentIds: [env.id, env2.id] });
  const r1 = svc.start('o1', app.id, { environmentId: env.id });
  assert.throws(() => svc.start('o1', app.id, { environmentId: env.id }), (e) => e.status === 409);
  const r2 = svc.start('o1', app.id, { environmentId: env2.id });
  await Promise.all([svc.waitFor(r1.id), svc.waitFor(r2.id)]);
});

test('org-wide concurrency cap', () => {
  const { svc, store, env } = setup({ stageDelayMs: 50, maxActivePerOrg: 2 });
  const apps = [1, 2, 3].map((i) => store.insert('apps', { orgId: 'o1', name: 'a' + i, slug: 'a' + i, environmentIds: [env.id], currentVersions: {} }));
  svc.start('o1', apps[0].id, { environmentId: env.id });
  svc.start('o1', apps[1].id, { environmentId: env.id });
  assert.throws(() => svc.start('o1', apps[2].id, { environmentId: env.id }), (e) => e.status === 429);
  svc.cancelAll();
});

test('cancel stops a running pipeline', async () => {
  const { svc, app, env } = setup({ stageDelayMs: 20 });
  const run = svc.start('o1', app.id, { environmentId: env.id });
  setTimeout(() => svc.cancel('o1', run.id), 30);
  const done = await svc.waitFor(run.id);
  assert.equal(done.status, 'cancelled');
  assert.ok(done.stages.some((s) => s.status === 'skipped'));
});

test('rejects env not attached to app and cross-org access', () => {
  const { svc, app, store } = setup();
  const other = store.insert('environments', { orgId: 'o1', name: 'Other', tier: 'staging' });
  assert.throws(() => svc.start('o1', app.id, { environmentId: other.id }), (e) => e.status === 400);
  assert.throws(() => svc.start('o2', app.id, { environmentId: 'e1' }), (e) => e.status === 404);
});

test('manual rollback redeploys previous successful version; nothing to roll back is 409', async () => {
  const { svc, app, env, store } = setup();
  assert.throws(() => svc.rollback('o1', app.id, { environmentId: env.id }), (e) => e.status === 409);
  await svc.waitFor(svc.start('o1', app.id, { environmentId: env.id }).id);
  await svc.waitFor(svc.start('o1', app.id, { environmentId: env.id }).id);
  const rb = await svc.waitFor(svc.rollback('o1', app.id, { environmentId: env.id, trigger: 'me' }).id);
  assert.equal(rb.kind, 'rollback');
  assert.equal(rb.status, 'succeeded');
  assert.equal(store.get('apps', app.id).currentVersions[env.id], 'v1');
});

test('runs interrupted by a restart are marked failed on recovery', () => {
  const store = new Store();
  store.insert('runs', { orgId: 'o1', status: 'running', stages: [{ key: 'build', status: 'running', logs: [] }] });
  const svc = new PipelineService({ store, bus: new EventBus(), stageDelayMs: 0 });
  svc.recover();
  const r = store.list('runs')[0];
  assert.equal(r.status, 'failed');
  assert.match(r.summary, /restart/i);
});

test('emits events for live streaming', async () => {
  const { svc, app, env, bus } = setup();
  const seen = [];
  const run = svc.start('o1', app.id, { environmentId: env.id });
  const off = bus.on(`run:${run.id}`, (e) => seen.push(e.type));
  await svc.waitFor(run.id);
  off();
  assert.ok(seen.includes('stage') && seen.includes('log') && seen.at(-1) === 'done', seen.join());
});

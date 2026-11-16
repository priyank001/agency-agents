import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../../src/lib/store.js';

const tmp = () => mkdtempSync(join(tmpdir(), 'opspilot-store-'));

test('in-memory store CRUD with org scoping', () => {
  const s = new Store();
  const a = s.insert('apps', { orgId: 'o1', name: 'a' });
  s.insert('apps', { orgId: 'o2', name: 'b' });
  assert.ok(a.id.startsWith('apps_'));
  assert.equal(s.list('apps', { orgId: 'o1' }).length, 1);
  assert.equal(s.get('apps', a.id, { orgId: 'o2' }), null, 'cross-org get must fail');
  assert.equal(s.get('apps', a.id, { orgId: 'o1' }).name, 'a');
  const u = s.update('apps', a.id, { name: 'a2', id: 'hijack', orgId: 'o2' }, { orgId: 'o1' });
  assert.equal(u.name, 'a2');
  assert.equal(u.id, a.id, 'id is immutable');
  assert.equal(u.orgId, 'o1', 'orgId is immutable');
  assert.equal(s.update('apps', a.id, { name: 'x' }, { orgId: 'o2' }), null);
  assert.equal(s.remove('apps', a.id, { orgId: 'o2' }), false);
  assert.equal(s.remove('apps', a.id, { orgId: 'o1' }), true);
  assert.equal(s.list('apps', { orgId: 'o1' }).length, 0);
});

test('returned records are copies; mutation does not leak into store', () => {
  const s = new Store();
  const a = s.insert('apps', { orgId: 'o1', name: 'a', nested: { x: 1 } });
  a.name = 'mutated';
  a.nested.x = 99;
  const fresh = s.get('apps', a.id);
  assert.equal(fresh.name, 'a');
  assert.equal(fresh.nested.x, 1);
});

test('persists atomically to disk and reloads', async () => {
  const dir = tmp();
  const s = new Store({ dir });
  s.insert('apps', { orgId: 'o1', name: 'persisted' });
  await s.flush();
  const file = join(dir, 'opspilot.json');
  assert.ok(existsSync(file));
  assert.deepEqual(readdirSync(dir).filter((f) => f.endsWith('.tmp')), []);
  const s2 = new Store({ dir });
  assert.equal(s2.list('apps', { orgId: 'o1' })[0].name, 'persisted');
});

test('corrupted data file is quarantined, not silently overwritten', () => {
  const dir = tmp();
  writeFileSync(join(dir, 'opspilot.json'), '{not json');
  const s = new Store({ dir });
  assert.equal(s.list('apps').length, 0);
  const files = readdirSync(dir);
  assert.ok(files.some((f) => f.startsWith('opspilot.json.corrupt-')), files.join(','));
});

test('find with predicate and sort/limit', () => {
  const s = new Store();
  for (let i = 0; i < 5; i++) s.insert('runs', { orgId: 'o', n: i, createdAt: 1000 + i });
  const r = s.list('runs', { orgId: 'o' }, { where: (x) => x.n % 2 === 0, sort: (a, b) => b.createdAt - a.createdAt, limit: 2 });
  assert.deepEqual(r.map((x) => x.n), [4, 2]);
});

test('collection cap prunes oldest when exceeding maxPerCollection', () => {
  const s = new Store({ caps: { audit: 3 } });
  for (let i = 0; i < 5; i++) s.insert('audit', { orgId: 'o', i });
  assert.deepEqual(s.list('audit').map((x) => x.i), [2, 3, 4]);
});

test('flush is serialized under concurrent writes', async () => {
  const dir = tmp();
  const s = new Store({ dir });
  await Promise.all(Array.from({ length: 50 }, (_, i) => { s.insert('x', { i }); return s.flush(); }));
  const data = JSON.parse(readFileSync(join(dir, 'opspilot.json'), 'utf8'));
  assert.equal(data.collections.x.length, 50);
});

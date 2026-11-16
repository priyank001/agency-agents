import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeSlo, ReliabilityService } from '../../src/domain/reliability.js';
import { Store } from '../../src/lib/store.js';
import { EventBus } from '../../src/lib/events.js';

const DAY = 86400000;

test('availability SLO math: budget, burn rate and status', () => {
  const now = 100 * DAY;
  const samples = [{ ts: now - 1000, requests: 100000, errors: 50, p95Ms: 120 }];
  const r = computeSlo({ indicator: 'availability', target: 99.9, windowDays: 30 }, samples, now);
  assert.equal(r.current, 99.95);
  assert.equal(r.burnRate, 0.5);
  assert.equal(r.errorBudgetRemaining, 0.5);
  assert.equal(r.status, 'ok');
  const breached = computeSlo({ indicator: 'availability', target: 99.9, windowDays: 30 }, [{ ts: now, requests: 1000, errors: 5, p95Ms: 1 }], now);
  assert.equal(breached.status, 'breached');
  assert.equal(breached.errorBudgetRemaining, 0);
  const risky = computeSlo({ indicator: 'availability', target: 99.9, windowDays: 30 }, [{ ts: now, requests: 100000, errors: 80, p95Ms: 1 }], now);
  assert.equal(risky.status, 'at_risk');
});

test('samples outside the window are ignored; no data is explicit', () => {
  const now = 100 * DAY;
  const r = computeSlo({ indicator: 'availability', target: 99, windowDays: 7 }, [{ ts: now - 8 * DAY, requests: 10, errors: 10 }], now);
  assert.equal(r.noData, true);
  assert.equal(r.current, null);
  assert.equal(r.errorBudgetRemaining, 1);
});

test('latency SLO is request-weighted share under threshold', () => {
  const now = DAY;
  const r = computeSlo({ indicator: 'latency', target: 90, windowDays: 1, latencyThresholdMs: 300 }, [
    { ts: now, requests: 900, errors: 0, p95Ms: 200 },
    { ts: now, requests: 100, errors: 0, p95Ms: 900 },
  ], now);
  assert.equal(r.current, 90);
  assert.equal(r.status, 'at_risk');
});

test('zero requests and absurd values do not produce NaN/Infinity', () => {
  const r = computeSlo({ indicator: 'availability', target: 100, windowDays: 1 }, [{ ts: 1, requests: 0, errors: 0 }], 2);
  for (const v of [r.burnRate, r.errorBudgetRemaining]) assert.ok(Number.isFinite(v), String(v));
});

function setup(opts = {}) {
  const store = new Store();
  const bus = new EventBus();
  const app = store.insert('apps', { orgId: 'o1', name: 'Shop', environmentIds: ['e'] , currentVersions: {} });
  const env = store.insert('environments', { orgId: 'o1', name: 'Prod', nodes: 3, size: 'medium', tier: 'production', hosting: 'cloud', provider: 'aws', runtime: 'kubernetes', status: 'healthy' });
  const rollbacks = [];
  const svc = new ReliabilityService({ store, bus, remediationDelayMs: 0, onRollback: (orgId, appId, envId) => rollbacks.push([orgId, appId, envId]), ...opts });
  svc.ensurePlaybooks('o1');
  return { store, svc, app, env, rollbacks };
}

test('chaos cpu-spike opens incident and autoscaling playbook mitigates + resolves it', async () => {
  const { svc, app, env, store } = setup();
  const inc = svc.chaos('o1', { appId: app.id, environmentId: env.id, scenario: 'cpu-spike' });
  assert.equal(inc.status, 'open');
  const done = await svc.waitForIncident(inc.id);
  assert.equal(done.status, 'resolved');
  assert.equal(store.get('environments', env.id).nodes, 5, 'scaled out by 2');
  assert.ok(done.timeline.length >= 3);
  assert.ok(done.plainSummary.length > 20);
});

test('bad-deploy triggers rollback hook; disabled playbook leaves incident open', async () => {
  const { svc, app, env, rollbacks } = setup();
  await svc.waitForIncident(svc.chaos('o1', { appId: app.id, environmentId: env.id, scenario: 'bad-deploy' }).id);
  assert.deepEqual(rollbacks, [['o1', app.id, env.id]]);
  const pb = svc.listPlaybooks('o1').find((p) => p.trigger === 'memory-leak');
  svc.setPlaybook('o1', pb.id, false);
  const inc = await svc.waitForIncident(svc.chaos('o1', { appId: app.id, environmentId: env.id, scenario: 'memory-leak' }).id);
  assert.equal(inc.status, 'open');
  assert.match(inc.timeline.at(-1).msg, /disabled|manual/i);
});

test('autoscaling respects a node ceiling', async () => {
  const { svc, app, env, store } = setup();
  store.update('environments', env.id, { nodes: 99 });
  const inc = await svc.waitForIncident(svc.chaos('o1', { appId: app.id, environmentId: env.id, scenario: 'cpu-spike' }).id);
  assert.equal(store.get('environments', env.id).nodes, 100);
  assert.ok(inc.timeline.some((t) => /limit|ceiling|maximum/i.test(t.msg)));
});

test('telemetry ingestion validates and feeds SLOs', () => {
  const { svc, app, env } = setup();
  svc.createSlo('o1', { appId: app.id, name: 'Checkout availability', indicator: 'availability', target: 99.9, windowDays: 30 });
  svc.ingest('o1', { appId: app.id, environmentId: env.id, requests: 10000, errors: 1, p95Ms: 120 });
  const [slo] = svc.listSlos('o1');
  assert.equal(slo.noData, false);
  assert.ok(slo.current > 99.9);
  assert.throws(() => svc.ingest('o1', { appId: app.id, environmentId: env.id, requests: 10, errors: 11, p95Ms: 1 }), (e) => e.status === 400);
  assert.throws(() => svc.ingest('o2', { appId: app.id, environmentId: env.id, requests: 10, errors: 1, p95Ms: 1 }), (e) => e.status === 404);
});

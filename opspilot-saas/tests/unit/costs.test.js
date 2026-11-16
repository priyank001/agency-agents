import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateEnvironmentCost, recommendSavings } from '../../src/domain/costs.js';

const env = (o) => ({ id: 'e1', name: 'x', tier: 'production', hosting: 'cloud', provider: 'aws', runtime: 'kubernetes', size: 'medium', nodes: 3, ...o });

test('cost scales linearly with nodes and with size', () => {
  const a = estimateEnvironmentCost(env({ nodes: 2 }));
  const b = estimateEnvironmentCost(env({ nodes: 4 }));
  assert.ok(b.monthlyCost > a.monthlyCost);
  const s = estimateEnvironmentCost(env({ size: 'small' }));
  const l = estimateEnvironmentCost(env({ size: 'large' }));
  assert.ok(l.monthlyCost > s.monthlyCost);
  const sum = a.breakdown.reduce((t, x) => t + x.cost, 0);
  assert.equal(Math.round(sum * 100) / 100, a.monthlyCost, 'breakdown sums to total');
});

test('kubernetes on cloud includes control plane fee; on-prem has no cloud fee but amortized hardware', () => {
  const k = estimateEnvironmentCost(env({}));
  assert.ok(k.breakdown.some((b) => /control plane/i.test(b.item)));
  const op = estimateEnvironmentCost(env({ hosting: 'on-prem', provider: 'vmware' }));
  assert.ok(op.breakdown.some((b) => /hardware|power/i.test(b.item)));
  assert.ok(!op.breakdown.some((b) => /control plane/i.test(b.item)));
});

test('hybrid includes both cloud and on-prem portions', () => {
  const h = estimateEnvironmentCost(env({ hosting: 'hybrid', provider: 'aws', onPremProvider: 'bare-metal', nodes: 4 }));
  assert.ok(h.breakdown.some((b) => /on-prem/i.test(b.item)));
  assert.ok(h.breakdown.some((b) => /cloud/i.test(b.item)));
});

test('costs are finite, non-negative numbers for every combination', () => {
  for (const hosting of ['cloud', 'on-prem', 'hybrid'])
    for (const provider of ['aws', 'gcp', 'azure', 'digitalocean', 'vmware', 'openstack', 'bare-metal'])
      for (const runtime of ['kubernetes', 'docker', 'vm'])
        for (const size of ['small', 'medium', 'large']) {
          const c = estimateEnvironmentCost(env({ hosting, provider, runtime, size, nodes: 1, onPremProvider: 'vmware' }));
          assert.ok(Number.isFinite(c.monthlyCost) && c.monthlyCost >= 0, JSON.stringify({ hosting, provider, runtime, size }));
        }
});

test('recommendations: oversized non-prod and always-on dev environments', () => {
  const recs = recommendSavings([
    env({ id: 'd', name: 'dev', tier: 'development', size: 'large', nodes: 3 }),
    env({ id: 'p', name: 'prod', tier: 'production', size: 'large', nodes: 6 }),
  ]);
  assert.ok(recs.some((r) => r.environmentId === 'd' && /smaller|right-size/i.test(r.title)));
  assert.ok(recs.some((r) => r.environmentId === 'd' && /night|schedule|off/i.test(r.title)));
  assert.ok(!recs.some((r) => r.environmentId === 'p' && /night|schedule/i.test(r.title)), 'never auto-sleep prod');
  for (const r of recs) assert.ok(r.monthlySavings > 0);
});

import test from 'node:test';
import assert from 'node:assert';
import { selfHealingEngine } from '../server/services/selfHealingEngine.js';
import { store } from '../server/services/store.js';

test('SRE - Autonomous Self-Healing on 5xx Error Spike', () => {
  store.reset();
  const result = selfHealingEngine.simulateFailureAndHeal('5xx_spike');

  assert.strictEqual(result.incident.severity, 'critical');
  assert.strictEqual(result.healingResult.success, true);
  assert.strictEqual(result.healingResult.rule.id, 'sh-rollback-5xx');
  assert.ok(result.healingResult.rule.executionCount >= 1);
});

test('SRE - Autonomous Self-Healing on CPU Surge', () => {
  store.reset();
  const result = selfHealingEngine.simulateFailureAndHeal('high_cpu');

  assert.strictEqual(result.healingResult.success, true);
  assert.strictEqual(result.healingResult.rule.id, 'sh-high-cpu-scale');
});


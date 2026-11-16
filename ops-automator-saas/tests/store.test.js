import test from 'node:test';
import assert from 'node:assert';
import { store } from '../server/services/store.js';

test('Store - Initialization & Tenant KPIs', () => {
  store.reset();
  const tenant = store.getTenant();
  assert.strictEqual(tenant.name, 'PayStream Technologies');
  assert.strictEqual(tenant.uptime, 99.98);
  assert.strictEqual(tenant.mttrMinutes, 14);
  assert.strictEqual(tenant.currentEnvironment, 'production');
});

test('Store - Environment Switcher', () => {
  store.reset();
  const successStaging = store.setEnvironment('staging');
  assert.strictEqual(successStaging, true);
  assert.strictEqual(store.getTenant().currentEnvironment, 'staging');

  const invalid = store.setEnvironment('non_existent_env');
  assert.strictEqual(invalid, false);
});

test('Store - Pipeline Trigger and Counter', () => {
  store.reset();
  const initialDeploys = store.getTenant().deploymentsToday;
  const pipe = store.triggerPipeline({ strategy: 'blue-green', environment: 'production' });

  assert.ok(pipe.id.startsWith('pipe-'));
  assert.strictEqual(pipe.strategy, 'blue-green');
  assert.strictEqual(store.getTenant().deploymentsToday, initialDeploys + 1);
});

test('Store - FinOps Recommendation Application', () => {
  store.reset();
  const initialSpend = store.getFinOps().monthlySpendUSD;
  const applied = store.applyRecommendation('rec-1');

  assert.ok(applied);
  assert.strictEqual(applied.status, 'applied');
  assert.strictEqual(store.getFinOps().monthlySpendUSD, initialSpend - applied.monthlySavingsUSD);
});


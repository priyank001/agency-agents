import test from 'node:test';
import assert from 'node:assert';
import { devopsAgent } from '../server/services/devopsAgent.js';
import { store } from '../server/services/store.js';

test('DevOps Automator Agent - Identity and Personality', () => {
  assert.strictEqual(devopsAgent.name, 'DevOps Automator');
  assert.strictEqual(devopsAgent.vibe, 'Automates infrastructure so your team ships faster and sleeps better.');
});

test('DevOps Automator Agent - Generates Assessment Deliverable', () => {
  store.reset();
  const res = devopsAgent.processPrompt('Please assess our infrastructure and create a high availability plan');

  assert.strictEqual(res.agent, 'DevOps Automator');
  assert.ok(res.markdown.includes('DevOps Infrastructure and Automation Plan'));
  assert.ok(res.markdown.includes('Cloud Platform Strategy'));
  assert.ok(res.markdown.includes('Zero-downtime'));
  assert.ok(Array.isArray(res.actions));
});

test('DevOps Automator Agent - Generates FinOps Cost Audit', () => {
  store.reset();
  const res = devopsAgent.processPrompt('Run a FinOps cloud cost reduction audit');

  assert.ok(res.markdown.includes('FinOps Infrastructure Cost Audit'));
  assert.ok(res.markdown.includes('Monthly Cloud Spend'));
  assert.ok(res.markdown.toLowerCase().includes('savings'));
});

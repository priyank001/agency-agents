import test from 'node:test';
import assert from 'node:assert';
import { pipelineEngine, PipelineEngine } from '../server/services/pipelineEngine.js';
import { store } from '../server/services/store.js';

test('PipelineEngine - Generates Valid GitHub Actions Workflow', () => {
  const yaml = PipelineEngine.generateGitHubActionsYaml('core-payments');
  assert.ok(yaml.includes('name: Production CI/CD Pipeline'));
  assert.ok(yaml.includes('job: security-scan') || yaml.includes('security-scan:'));
  assert.ok(yaml.includes('aquasecurity/trivy-action'));
  assert.ok(yaml.includes('blue-green-deploy:'));
  assert.ok(yaml.includes('Automated Rollback on Failure'));
});

test('PipelineEngine - Simulates Emergency Rollback', () => {
  store.reset();
  const pipe = store.triggerPipeline({ strategy: 'blue-green' });
  const rolledBack = pipelineEngine.simulateRollback(pipe.id);

  assert.strictEqual(rolledBack.status, 'rolled-back');
  assert.ok(rolledBack.logs.some(l => l.includes('[ROLLBACK]')));
});


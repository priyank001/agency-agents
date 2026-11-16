import test from 'node:test';
import assert from 'node:assert';

import { store } from '../server/services/store.js';
import { IaCEngine } from '../server/services/iacEngine.js';
import { PipelineEngine, pipelineEngine } from '../server/services/pipelineEngine.js';
import { selfHealingEngine } from '../server/services/selfHealingEngine.js';
import { IntegrationsService } from '../server/services/integrationsService.js';
import { NoTechWizard } from '../server/services/noTechWizard.js';
import { devopsAgent } from '../server/services/devopsAgent.js';
import { handleExportBundle } from '../server/routes/export.js';
import { EventEmitter } from 'node:events';

class MockResponse extends EventEmitter {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.body = '';
  }
  writeHead(status, headers = {}) {
    this.statusCode = status;
    Object.assign(this.headers, headers);
  }
  setHeader(k, v) {
    this.headers[k] = v;
  }
  end(data = '') {
    this.body += data;
    this.emit('finish');
  }
}

test('Integration Flow 1: Non-Tech Founder Onboarding -> Hybrid IaC -> Pipeline Run', () => {
  store.reset();

  // 1. Founder builds blueprint
  const blueprint = NoTechWizard.buildStartupBlueprint({
    businessType: 'fintech',
    infraType: 'hybrid',
    companyName: 'ApexPay',
    scale: 'growth'
  });

  assert.strictEqual(blueprint.companyName, 'ApexPay');
  assert.strictEqual(blueprint.infraType, 'hybrid');
  assert.ok(blueprint.generatedDeliverables.terraform.length > 0);
  assert.ok(blueprint.generatedDeliverables.ansible.length > 0);
  assert.ok(blueprint.generatedDeliverables.hybridVpn.length > 0);

  // 2. Audit compliance of generated Terraform
  const audit = IaCEngine.auditCompliance(blueprint.generatedDeliverables.terraform);
  assert.strictEqual(audit.score, 100);

  // 3. Trigger CI/CD Pipeline based on blueprint
  const pipe = store.triggerPipeline({
    name: 'ApexPay Production Deployment',
    branch: 'main',
    environment: 'production',
    strategy: 'blue-green'
  });

  assert.strictEqual(pipe.status, 'in-progress');
  assert.strictEqual(pipe.stages.length, 5);
  assert.strictEqual(store.getTenant().deploymentsToday, 9);
});

test('Integration Flow 2: Live Incident Injection -> Self-Healing Rollback -> SLO Recovery', () => {
  store.reset();

  // 1. Simulate 5xx incident
  const sim = selfHealingEngine.simulateFailureAndHeal('5xx_spike');
  assert.strictEqual(sim.incident.severity, 'critical');
  assert.strictEqual(sim.healingResult.success, true);
  assert.strictEqual(sim.healingResult.rule.id, 'sh-rollback-5xx');

  // 2. Verify active incident resolution in Store
  const sre = store.getSRE();
  const inc = sre.incidents.find(i => i.id === sim.incident.id);
  assert.strictEqual(inc.status, 'resolved');
  assert.strictEqual(inc.autoHealed, true);

  // 3. Verify SLO health remains compliant
  const availabilitySlo = sre.slos.find(s => s.id === 'slo-availability');
  assert.ok(availabilitySlo.current >= 99.9);
});

test('Integration Flow 3: FinOps Audit -> Recommendation Application -> Spend Ledger Update', () => {
  store.reset();

  const initialSpend = store.getFinOps().monthlySpendUSD;
  const initialSavings = store.getFinOps().projectedSavingsUSD;

  // 1. Apply Right-Sizing recommendation
  const applied = store.applyRecommendation('rec-1');
  assert.ok(applied);
  assert.strictEqual(applied.status, 'applied');
  assert.strictEqual(applied.monthlySavingsUSD, 240);

  // 2. Verify spend ledger updated
  const newSpend = store.getFinOps().monthlySpendUSD;
  assert.strictEqual(newSpend, initialSpend - 240);
});

test('Integration Flow 4: DevOps Toolchain Sync -> Hybrid WireGuard Mesh Failover', () => {
  store.reset();

  // 1. Sync Jenkins & Vault tools
  const jenkins = store.syncToolIntegration('jenkins');
  assert.strictEqual(jenkins.status, 'connected');

  const vault = store.syncToolIntegration('vault');
  assert.strictEqual(vault.status, 'connected');

  // 2. Verify On-Premise node inventory
  const hybrid = store.getHybridState();
  assert.strictEqual(hybrid.onPremNodes.length, 3);
  assert.ok(hybrid.onPremNodes.every(n => n.status === 'healthy'));

  // 3. Trigger hybrid failover to On-Premise
  const updatedHybrid = store.toggleHybridFailover('onprem');
  assert.strictEqual(updatedHybrid.activeRouting, 'onprem');

  // 4. Restore balanced hybrid routing
  const restoredHybrid = store.toggleHybridFailover('hybrid-balanced');
  assert.strictEqual(restoredHybrid.activeRouting, 'hybrid-balanced');
});

test('Integration Flow 5: DevOps Automator Agent AI -> Full Production Bundle Export', () => {
  store.reset();

  // 1. Query Agent for complete infrastructure assessment
  const agentResponse = devopsAgent.processPrompt('Assess our infrastructure and generate high availability plan');
  assert.strictEqual(agentResponse.agent, 'DevOps Automator');
  assert.ok(agentResponse.markdown.includes('DevOps Infrastructure and Automation Plan'));
  assert.ok(agentResponse.actions.some(a => a.action === 'generate_terraform'));

  // 2. Request and verify complete export kit bundle
  const res = new MockResponse();
  handleExportBundle({}, res);
  assert.strictEqual(res.statusCode, 200);

  const bundle = JSON.parse(res.body);
  assert.strictEqual(bundle.platform, 'OpsAutomator SaaS');
  assert.strictEqual(bundle.files.length, 7);

  const expectedPaths = [
    'terraform/main.tf',
    'k8s/deployment.yaml',
    '.github/workflows/deploy.yml',
    'monitoring/prometheus.yml',
    'monitoring/alert_rules.yml',
    'Dockerfile',
    'README.md'
  ];

  for (const expected of expectedPaths) {
    const file = bundle.files.find(f => f.path === expected);
    assert.ok(file, `Missing bundle file: ${expected}`);
    assert.ok(file.content.length > 20, `File content too short: ${expected}`);
  }
});


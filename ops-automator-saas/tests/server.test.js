import test from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'node:events';

import { handleStats, handleSwitchEnv } from '../server/routes/stats.js';
import { handleGetInfra, handleGenerateIaC, handleDriftCheck } from '../server/routes/infra.js';
import { handleGetPipelines, handleTriggerPipeline, handleRollbackPipeline } from '../server/routes/pipelines.js';
import { handleGetSRE, handleToggleRule, handleSimulateIncident } from '../server/routes/sre.js';
import { handleGetFinOps, handleApplyRecommendation } from '../server/routes/finops.js';
import { handleGetSecurity, handleTriggerSecurityScan } from '../server/routes/security.js';
import { handleAgentQuery } from '../server/routes/agent.js';
import { handleExportBundle } from '../server/routes/export.js';
import { handleGetHybrid, handleHybridFailover, handleGetVpnConfig } from '../server/routes/hybrid.js';
import { handleGetIntegrations, handleSyncIntegration, handleGenerateToolConfig } from '../server/routes/integrations.js';
import { handleGetArchetypes, handleGetGlossary, handleBuildBlueprint } from '../server/routes/notech.js';
import { handleRunChaosBattery } from '../server/routes/chaos.js';
import { store } from '../server/services/store.js';

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

test('API Route - handleStats', () => {
  store.reset();
  const res = new MockResponse();
  handleStats({}, res);

  assert.strictEqual(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.strictEqual(data.tenant.name, 'PayStream Technologies');
  assert.strictEqual(data.kpis.uptime, 99.98);
});

test('API Route - handleSwitchEnv', () => {
  store.reset();
  const res = new MockResponse();
  handleSwitchEnv({}, res, JSON.stringify({ environment: 'staging' }));

  assert.strictEqual(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.strictEqual(data.currentEnvironment, 'staging');
});

test('API Route - handleGenerateIaC', () => {
  const res = new MockResponse();
  handleGenerateIaC({}, res, JSON.stringify({ type: 'terraform', appName: 'paystream-api' }));

  assert.strictEqual(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.ok(data.code.includes('aws_lb'));
  assert.ok(data.infracost.totalMonthlyUSD > 0);
  assert.strictEqual(data.compliance.score, 100);
});

test('API Route - handleDriftCheck', () => {
  store.reset();
  const resSim = new MockResponse();
  handleDriftCheck({}, resSim, JSON.stringify({ action: 'simulate', environment: 'production' }));
  assert.strictEqual(resSim.statusCode, 200);
  assert.ok(JSON.parse(resSim.body).driftStatus.includes('drift-detected'));

  const resRem = new MockResponse();
  handleDriftCheck({}, resRem, JSON.stringify({ action: 'remediate', environment: 'production' }));
  assert.strictEqual(resRem.statusCode, 200);
  assert.strictEqual(JSON.parse(resRem.body).driftStatus, 'in-sync');
});

test('API Route - handlePipelines Lifecycle', () => {
  store.reset();
  const resTrigger = new MockResponse();
  handleTriggerPipeline({}, resTrigger, JSON.stringify({ strategy: 'blue-green', environment: 'production' }));
  assert.strictEqual(resTrigger.statusCode, 201);
  const triggered = JSON.parse(resTrigger.body);
  assert.strictEqual(triggered.pipeline.strategy, 'blue-green');

  const resGet = new MockResponse();
  handleGetPipelines({}, resGet);
  assert.strictEqual(resGet.statusCode, 200);
  const list = JSON.parse(resGet.body);
  assert.ok(list.length > 0);

  const resRollback = new MockResponse();
  handleRollbackPipeline({}, resRollback, JSON.stringify({ pipelineId: triggered.pipeline.id }));
  assert.strictEqual(resRollback.statusCode, 200);
  assert.strictEqual(JSON.parse(resRollback.body).pipeline.status, 'rolled-back');
});

test('API Route - handleGetSRE & handleToggleRule', () => {
  store.reset();
  const resSre = new MockResponse();
  handleGetSRE({}, resSre);
  assert.strictEqual(resSre.statusCode, 200);
  const data = JSON.parse(resSre.body);
  assert.ok(Array.isArray(data.slos));

  const resToggle = new MockResponse();
  handleToggleRule({}, resToggle, JSON.stringify({ ruleId: 'sh-rollback-5xx' }));
  assert.strictEqual(resToggle.statusCode, 200);
  assert.strictEqual(JSON.parse(resToggle.body).rule.enabled, false);
});

test('API Route - handleSimulateIncident and Autonomous Healing', () => {
  store.reset();
  const res = new MockResponse();
  handleSimulateIncident({}, res, JSON.stringify({ failureType: '5xx_spike' }));
  assert.strictEqual(res.statusCode, 201);
  const data = JSON.parse(res.body);
  assert.strictEqual(data.incident.severity, 'critical');
  assert.strictEqual(data.healingResult.success, true);
});

test('API Route - handleFinOps and Apply Recommendation', () => {
  store.reset();
  const res = new MockResponse();
  handleApplyRecommendation({}, res, JSON.stringify({ id: 'rec-1' }));
  assert.strictEqual(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.strictEqual(data.applied.status, 'applied');
});

test('API Route - handleSecurity and Scan', () => {
  store.reset();
  const resScan = new MockResponse();
  handleTriggerSecurityScan({}, resScan);
  assert.strictEqual(resScan.statusCode, 200);
  assert.ok(JSON.parse(resScan.body).success);

  const resGet = new MockResponse();
  handleGetSecurity({}, resGet);
  assert.strictEqual(resGet.statusCode, 200);
  assert.strictEqual(JSON.parse(resGet.body).complianceScore, 94);
});

test('API Route - handleAgentQuery', () => {
  store.reset();
  const res = new MockResponse();
  handleAgentQuery({}, res, JSON.stringify({ prompt: 'Assess our startup infrastructure' }));
  assert.strictEqual(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.strictEqual(data.agent, 'DevOps Automator');
  assert.ok(data.markdown.includes('DevOps Infrastructure and Automation Plan'));
});

test('API Route - handleExportBundle', () => {
  const res = new MockResponse();
  handleExportBundle({}, res);
  assert.strictEqual(res.statusCode, 200);
  const bundle = JSON.parse(res.body);
  assert.ok(Array.isArray(bundle.files));
  assert.ok(bundle.files.some(f => f.path === 'terraform/main.tf'));
  assert.ok(bundle.files.some(f => f.path === '.github/workflows/deploy.yml'));
  assert.ok(bundle.files.some(f => f.path === 'monitoring/alert_rules.yml'));
});

test('API Route - Hybrid Infrastructure Endpoints', () => {
  store.reset();
  const resGet = new MockResponse();
  handleGetHybrid({}, resGet);
  assert.strictEqual(resGet.statusCode, 200);
  const hybrid = JSON.parse(resGet.body);
  assert.ok(hybrid.wireguardMesh);
  assert.ok(Array.isArray(hybrid.onPremNodes));

  const resFailover = new MockResponse();
  handleHybridFailover({}, resFailover, JSON.stringify({ target: 'onprem' }));
  assert.strictEqual(resFailover.statusCode, 200);
  assert.strictEqual(JSON.parse(resFailover.body).hybrid.activeRouting, 'onprem');

  const resVpn = new MockResponse();
  handleGetVpnConfig({}, resVpn);
  assert.strictEqual(resVpn.statusCode, 200);
  assert.ok(resVpn.body.includes('[Interface]'));
});

test('API Route - DevOps Tools Integration Hub Endpoints', () => {
  store.reset();
  const resGet = new MockResponse();
  handleGetIntegrations({}, resGet);
  assert.strictEqual(resGet.statusCode, 200);
  const tools = JSON.parse(resGet.body);
  assert.ok(Array.isArray(tools));
  assert.ok(tools.length >= 10);

  const resSync = new MockResponse();
  handleSyncIntegration({}, resSync, JSON.stringify({ toolId: 'jenkins' }));
  assert.strictEqual(resSync.statusCode, 200);
  assert.strictEqual(JSON.parse(resSync.body).tool.id, 'jenkins');

  const resGen = new MockResponse();
  handleGenerateToolConfig({}, resGen, JSON.stringify({ tool: 'jenkins', appName: 'fintech-core' }));
  assert.strictEqual(resGen.statusCode, 200);
  assert.ok(JSON.parse(resGen.body).content.includes('pipeline {'));
});

test('API Route - No-Tech Founder Mode Endpoints', () => {
  const resArch = new MockResponse();
  handleGetArchetypes({}, resArch);
  assert.strictEqual(resArch.statusCode, 200);
  assert.ok(Array.isArray(JSON.parse(resArch.body)));

  const resGlossary = new MockResponse();
  handleGetGlossary({}, resGlossary);
  assert.strictEqual(resGlossary.statusCode, 200);
  assert.ok(Array.isArray(JSON.parse(resGlossary.body)));

  const resBlueprint = new MockResponse();
  handleBuildBlueprint({}, resBlueprint, JSON.stringify({ businessType: 'ecommerce', infraType: 'hybrid', companyName: 'ShopMax' }));
  assert.strictEqual(resBlueprint.statusCode, 200);
  const bp = JSON.parse(resBlueprint.body);
  assert.strictEqual(bp.companyName, 'ShopMax');
  assert.ok(bp.generatedDeliverables.terraform);
});

test('API Route - Chaos & Hardening Battery Run', () => {
  const resChaos = new MockResponse();
  handleRunChaosBattery({}, resChaos);
  assert.strictEqual(resChaos.statusCode, 200);
  const data = JSON.parse(resChaos.body);
  assert.strictEqual(data.overallRobustnessScore, 100);
  assert.ok(Array.isArray(data.results));
});

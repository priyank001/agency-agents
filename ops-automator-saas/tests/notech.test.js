import test from 'node:test';
import assert from 'node:assert';
import { NoTechWizard } from '../server/services/noTechWizard.js';

test('NoTechWizard - Returns Startup Archetypes Catalog', () => {
  const archetypes = NoTechWizard.getArchetypes();
  assert.ok(Array.isArray(archetypes));
  assert.strictEqual(archetypes.length, 5);
  assert.ok(archetypes.some(a => a.id === 'b2b-saas'));
  assert.ok(archetypes.some(a => a.id === 'fintech'));
  assert.ok(archetypes.some(a => a.id === 'healthtech'));
  assert.ok(archetypes.some(a => a.id === 'ai-startup'));
});

test('NoTechWizard - Returns Plain-English DevOps Glossary', () => {
  const glossary = NoTechWizard.getGlossary();
  assert.ok(Array.isArray(glossary));
  assert.ok(glossary.length >= 5);
  assert.ok(glossary.some(g => g.term === 'Auto-Scaling'));
  assert.ok(glossary.some(g => g.term === 'Blue-Green Deployment'));
  assert.ok(glossary.some(g => g.term === 'Hybrid Infrastructure'));
});

test('NoTechWizard - Builds Complete Hybrid FinTech Blueprint', () => {
  const blueprint = NoTechWizard.buildStartupBlueprint({
    businessType: 'fintech',
    infraType: 'hybrid',
    companyName: 'FinNova Labs',
    scale: 'growth'
  });

  assert.strictEqual(blueprint.companyName, 'FinNova Labs');
  assert.strictEqual(blueprint.infraType, 'hybrid');
  assert.ok(blueprint.plainEnglishSummary.includes('Hybrid Architecture'));
  assert.ok(blueprint.estimatedMonthlyCostUSD > 0);
  assert.strictEqual(blueprint.slaGuarantee, '99.98% Uptime SLA');
  assert.ok(blueprint.generatedDeliverables.terraform.includes('aws_lb'));
  assert.ok(blueprint.generatedDeliverables.ansible.includes('K3s'));
  assert.ok(blueprint.generatedDeliverables.jenkinsfile.includes('pipeline {'));
  assert.ok(blueprint.generatedDeliverables.hybridVpn.includes('WireGuard'));
});

test('NoTechWizard - Builds 100% On-Premise Blueprint', () => {
  const blueprint = NoTechWizard.buildStartupBlueprint({
    businessType: 'healthtech',
    infraType: 'onprem',
    companyName: 'MedSecure',
    scale: 'early'
  });

  assert.strictEqual(blueprint.infraType, 'onprem');
  assert.ok(blueprint.plainEnglishSummary.includes('100% On-Premise'));
  assert.ok(blueprint.generatedDeliverables.ansible.includes('ufw'));
});


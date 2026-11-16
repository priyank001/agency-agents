import test from 'node:test';
import assert from 'node:assert';
import { IaCEngine } from '../server/services/iacEngine.js';

test('IaCEngine - Generates Valid AWS Multi-AZ Terraform', () => {
  const tf = IaCEngine.generateTerraform({
    appName: 'shop-checkout',
    region: 'us-east-1',
    minInstances: 3,
    maxInstances: 12,
    instanceType: 't3.large'
  });

  assert.ok(tf.includes('provider "aws"'));
  assert.ok(tf.includes('region = "us-east-1"'));
  assert.ok(tf.includes('resource "aws_lb" "main"'));
  assert.ok(tf.includes('resource "aws_lb_target_group" "blue"'));
  assert.ok(tf.includes('resource "aws_lb_target_group" "green"'));
  assert.ok(tf.includes('desired_capacity    = 3'));
  assert.ok(tf.includes('max_size            = 12'));
  assert.ok(tf.includes('resource "aws_cloudwatch_metric_alarm" "high_cpu"'));
});

test('IaCEngine - Generates Valid Kubernetes Manifests', () => {
  const k8s = IaCEngine.generateKubernetesManifests({
    appName: 'shop-checkout',
    replicas: 4
  });

  assert.ok(k8s.includes('kind: Deployment'));
  assert.ok(k8s.includes('name: shop-checkout'));
  assert.ok(k8s.includes('replicas: 4'));
  assert.ok(k8s.includes('kind: HorizontalPodAutoscaler'));
  assert.ok(k8s.includes('type: RollingUpdate'));
});

test('IaCEngine - Calculates Infracost Accurately', () => {
  const cost = IaCEngine.calculateInfracost({
    instances: 4,
    instanceType: 't3.medium',
    multiAz: true
  });

  assert.ok(cost.totalMonthlyUSD > 0);
  assert.ok(Array.isArray(cost.breakdown));
  assert.ok(cost.breakdown.some(b => b.component.includes('Compute')));
  assert.ok(cost.breakdown.some(b => b.component.includes('Application Load Balancer')));
});

test('IaCEngine - Audits Security & Compliance', () => {
  const tf = IaCEngine.generateTerraform({ appName: 'test-api' });
  const audit = IaCEngine.auditCompliance(tf);

  assert.strictEqual(audit.score, 100);
  assert.strictEqual(audit.passedChecks, audit.totalChecks);
});


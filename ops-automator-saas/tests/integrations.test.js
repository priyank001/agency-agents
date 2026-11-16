import test from 'node:test';
import assert from 'node:assert';
import { IntegrationsService } from '../server/services/integrationsService.js';

test('IntegrationsService - Generates Declarative Jenkinsfile with Maven and Docker', () => {
  const jenkinsfile = IntegrationsService.generateJenkinsfile({
    appName: 'paystream-gateway',
    buildTool: 'maven',
    deploymentTarget: 'hybrid-k8s'
  });

  assert.ok(jenkinsfile.includes('pipeline {'));
  assert.ok(jenkinsfile.includes("APP_NAME         = 'paystream-gateway'"));
  assert.ok(jenkinsfile.includes("stage('Maven Build & Test')"));
  assert.ok(jenkinsfile.includes('mvn clean package'));
  assert.ok(jenkinsfile.includes("stage('Docker Multi-Stage Build & Push')"));
  assert.ok(jenkinsfile.includes('docker buildx build'));
  assert.ok(jenkinsfile.includes("stage('Zero-Downtime Deployment')"));
  assert.ok(jenkinsfile.includes('kubectl rollout undo'));
});

test('IntegrationsService - Generates Declarative Jenkinsfile with NPM', () => {
  const jenkinsfile = IntegrationsService.generateJenkinsfile({
    appName: 'frontend-app',
    buildTool: 'npm',
    deploymentTarget: 'cloud'
  });

  assert.ok(jenkinsfile.includes("stage('NPM Build & Test')"));
  assert.ok(jenkinsfile.includes('npm ci'));
  assert.ok(jenkinsfile.includes('npm test'));
});

test('IntegrationsService - Generates Production Maven POM with Jib', () => {
  const pom = IntegrationsService.generateMavenPom('paystream-core', 'io.paystream');

  assert.ok(pom.includes('<groupId>io.paystream</groupId>'));
  assert.ok(pom.includes('<artifactId>paystream-core</artifactId>'));
  assert.ok(pom.includes('junit-jupiter'));
  assert.ok(pom.includes('jib-maven-plugin'));
});

test('IntegrationsService - Generates Ansible On-Prem Bare-Metal Playbook', () => {
  const playbook = IntegrationsService.generateAnsiblePlaybook({
    clusterName: 'dallas-dc-cluster'
  });

  assert.ok(playbook.includes('- name: Provision and Harden On-Premise Infrastructure Nodes'));
  assert.ok(playbook.includes('wireguard'));
  assert.ok(playbook.includes('Install K3s Lightweight Kubernetes for Bare-Metal'));
  assert.ok(playbook.includes('prom/node-exporter'));
});

test('IntegrationsService - Generates Hybrid WireGuard VPN Config', () => {
  const vpn = IntegrationsService.generateHybridVpnConfig({
    cloudGatewayIp: '54.210.12.99',
    onPremSubnet: '192.168.20.0/24',
    cloudVpcSubnet: '10.100.0.0/16'
  });

  assert.ok(vpn.includes('[Interface]'));
  assert.ok(vpn.includes('[Peer]'));
  assert.ok(vpn.includes('54.210.12.99:51820'));
  assert.ok(vpn.includes('AllowedIPs = 10.100.0.0/16'));
});

test('IntegrationsService - Generates k6 Load Stress Test Script', () => {
  const k6 = IntegrationsService.generateK6LoadTest({
    targetUrl: 'https://api.startup.io'
  });

  assert.ok(k6.includes('import http from \'k6/http\''));
  assert.ok(k6.includes('p(95)<250'));
  assert.ok(k6.includes('https://api.startup.io/health'));
});

test('IntegrationsService - Generates HashiCorp Vault Application Policy', () => {
  const vault = IntegrationsService.generateVaultConfig('checkout-service');

  assert.ok(vault.includes('path "secret/data/checkout-service/*"'));
  assert.ok(vault.includes('capabilities = ["read"]'));
});


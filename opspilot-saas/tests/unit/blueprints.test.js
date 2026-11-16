import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateBlueprint } from '../../src/domain/blueprints/index.js';
import { scanDockerfile, scanKubernetes } from '../../src/domain/policy.js';

const app = (o = {}) => ({ id: 'a1', name: 'Shop API', slug: 'shop-api', language: 'java', buildTool: 'maven', repoUrl: 'https://github.com/acme/shop.git', branch: 'main', ciProvider: 'jenkins', strategy: 'rolling', port: 8080, healthPath: '/health', ...o });
const envs = (o = {}) => [{ id: 'e1', name: 'Production', slug: 'production', tier: 'production', hosting: 'cloud', provider: 'aws', region: 'us-east-1', runtime: 'kubernetes', size: 'medium', nodes: 3, ...o }];
const file = (bp, path) => bp.files.find((f) => f.path === path);

test('java + maven + jenkins: Jenkinsfile with maven, tests, scan, deploy & rollback', () => {
  const bp = generateBlueprint(app(), envs());
  const jf = file(bp, 'Jenkinsfile');
  assert.ok(jf, bp.files.map((f) => f.path).join());
  for (const s of ['mvn -B', 'junit', 'trivy', 'docker build', 'kubectl', 'rollout undo']) assert.ok(jf.content.includes(s), s);
  assert.match(file(bp, 'Dockerfile').content, /eclipse-temurin/);
  for (const f of bp.files) assert.ok(f.explanation && f.explanation.length > 20, `${f.path} needs a plain-English explanation`);
});

test('each language/build tool produces a matching Dockerfile', () => {
  const cases = [
    ['node', 'npm', /npm ci/], ['node', 'yarn', /yarn install --frozen-lockfile/], ['node', 'pnpm', /pnpm install --frozen-lockfile/],
    ['python', 'pip', /pip install/], ['python', 'poetry', /poetry/], ['go', 'go', /go build/], ['java', 'gradle', /gradle/],
    ['dotnet', 'dotnet', /dotnet publish/], ['static', 'none', /nginx/],
  ];
  for (const [language, buildTool, re] of cases) {
    const bp = generateBlueprint(app({ language, buildTool }), envs());
    assert.match(file(bp, 'Dockerfile').content, re, `${language}/${buildTool}`);
  }
});

test('ci provider selects the right pipeline file', () => {
  assert.ok(file(generateBlueprint(app({ ciProvider: 'github-actions', language: 'node', buildTool: 'npm' }), envs()), '.github/workflows/deploy.yml'));
  assert.ok(file(generateBlueprint(app({ ciProvider: 'gitlab-ci' }), envs()), '.gitlab-ci.yml'));
});

test('strategy shapes kubernetes rollout', () => {
  const rolling = generateBlueprint(app(), envs());
  assert.match(file(rolling, 'k8s/deployment.yaml').content, /maxUnavailable: 0/);
  const canary = generateBlueprint(app({ strategy: 'canary' }), envs());
  assert.match(file(canary, 'k8s/rollout.yaml').content, /kind: Rollout[\s\S]*canary:[\s\S]*setWeight: 10/);
  const bg = generateBlueprint(app({ strategy: 'blue-green' }), envs());
  assert.match(file(bg, 'k8s/rollout.yaml').content, /blueGreen:[\s\S]*previewService/);
});

test('hosting decides terraform vs ansible; hybrid gets both', () => {
  assert.ok(file(generateBlueprint(app(), envs()), 'terraform/main.tf'));
  assert.ok(!file(generateBlueprint(app(), envs()), 'ansible/playbook.yml'));
  const op = generateBlueprint(app(), envs({ hosting: 'on-prem', provider: 'vmware' }));
  assert.ok(file(op, 'ansible/playbook.yml'));
  assert.ok(!file(op, 'terraform/main.tf'));
  const hy = generateBlueprint(app(), envs({ hosting: 'hybrid', provider: 'azure', onPremProvider: 'bare-metal' }));
  assert.ok(file(hy, 'ansible/playbook.yml') && file(hy, 'terraform/main.tf'));
  assert.match(file(hy, 'terraform/main.tf').content, /azurerm/);
  assert.match(file(generateBlueprint(app(), envs({ provider: 'gcp' })), 'terraform/main.tf').content, /google_container_cluster/);
});

test('docker / vm runtimes skip kubernetes manifests', () => {
  const d = generateBlueprint(app(), envs({ runtime: 'docker' }));
  assert.ok(!d.files.some((f) => f.path.startsWith('k8s/')));
  assert.ok(file(d, 'docker-compose.yml'));
});

test('monitoring alerts generated with SLO-aligned rules', () => {
  const m = file(generateBlueprint(app(), envs()), 'monitoring/alerts.yml');
  assert.match(m.content, /HighErrorRate/);
  assert.match(m.content, /HighResponseTime/);
});

test('generated configs pass our own policy engine (dogfooding)', () => {
  for (const strategy of ['rolling', 'canary', 'blue-green']) {
    for (const language of ['java', 'node', 'python', 'go', 'dotnet', 'static']) {
      const buildTool = { java: 'maven', node: 'npm', python: 'pip', go: 'go', dotnet: 'dotnet', static: 'none' }[language];
      const bp = generateBlueprint(app({ strategy, language, buildTool }), envs());
      assert.equal(bp.policy.passed, true, `${strategy}/${language}: ${JSON.stringify(bp.policy.findings)}`);
      assert.equal(bp.policy.score, 100);
    }
  }
});

test('policy engine flags insecure Dockerfiles', () => {
  const r = scanDockerfile('FROM node:latest\nRUN curl http://x.sh | sh\nCOPY . .\nENV AWS_SECRET_ACCESS_KEY=abc123\nCMD node app.js\n');
  const ids = r.findings.map((f) => f.id);
  for (const id of ['DF001', 'DF002', 'DF003', 'DF004']) assert.ok(ids.includes(id), id + ' in ' + ids);
  assert.equal(r.passed, false);
  assert.ok(r.score < 60);
  assert.ok(r.findings.every((f) => f.fix && f.line >= 1));
});

test('policy engine flags insecure Kubernetes manifests', () => {
  const yaml = `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web\nspec:\n  replicas: 1\n  template:\n    spec:\n      hostNetwork: true\n      containers:\n        - name: web\n          image: nginx:latest\n          securityContext:\n            privileged: true\n`;
  const ids = scanKubernetes(yaml).findings.map((f) => f.id);
  for (const id of ['K8S001', 'K8S002', 'K8S003', 'K8S004', 'K8S005', 'K8S006']) assert.ok(ids.includes(id), id + ' in ' + ids);
});

test('policy engine survives garbage input', () => {
  for (const junk of ['', '\u0000\u0001', 'a'.repeat(100000), '---\n---\n', '{{{{']) {
    assert.doesNotThrow(() => scanDockerfile(junk));
    assert.doesNotThrow(() => scanKubernetes(junk));
  }
});

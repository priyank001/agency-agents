import test from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';

import { GitHubService } from '../server/services/githubService.js';
import { store } from '../server/services/store.js';
import {
  handleGetGitHubStatus,
  handleConnectGitHub,
  handleDisconnectGitHub,
  handleGitHubWebhook,
  handleSimulateGitHubPush
} from '../server/routes/github.js';

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

test('GitHubService - Username Validation Rules', () => {
  // Valid usernames
  assert.strictEqual(GitHubService.isValidUsername('priyanknamdev'), true);
  assert.strictEqual(GitHubService.isValidUsername('octocat'), true);
  assert.strictEqual(GitHubService.isValidUsername('startup-ops-bot'), true);
  assert.strictEqual(GitHubService.isValidUsername('dev-42'), true);

  // Invalid usernames
  assert.strictEqual(GitHubService.isValidUsername(''), false);
  assert.strictEqual(GitHubService.isValidUsername(null), false);
  assert.strictEqual(GitHubService.isValidUsername(undefined), false);
  assert.strictEqual(GitHubService.isValidUsername('-invalid'), false);
  assert.strictEqual(GitHubService.isValidUsername('invalid-'), false);
  assert.strictEqual(GitHubService.isValidUsername('double--hyphen'), false);
  assert.strictEqual(GitHubService.isValidUsername('a'.repeat(40)), false);
});

test('GitHubService - Connect and Validate GitHub Profile', () => {
  store.reset();
  const profile = GitHubService.connectProfile({
    username: 'priyanknamdev',
    token: 'ghp_mockPersonalAccessToken12345',
    repo: 'payments-microservice'
  });

  assert.strictEqual(profile.connected, true);
  assert.strictEqual(profile.username, 'priyanknamdev');
  assert.strictEqual(profile.avatarUrl, 'https://github.com/priyanknamdev.png');
  assert.strictEqual(profile.activeRepository, 'priyanknamdev/payments-microservice');
  assert.ok(profile.webhookSecret.startsWith('whsec_'));
  assert.strictEqual(profile.webhookUrl, '/api/github/webhook');
  assert.ok(Array.isArray(profile.repositories));
  assert.ok(profile.repositories.length >= 3);
});

test('GitHubService - Reject Malformed Username on Connect', () => {
  store.reset();
  assert.throws(() => {
    GitHubService.connectProfile({ username: 'invalid--username' });
  }, /Invalid GitHub username format/);
});

test('GitHubService - Disconnect Profile', () => {
  store.reset();
  GitHubService.connectProfile({ username: 'priyanknamdev' });
  assert.strictEqual(store.getGitHubProfile().connected, true);

  const cleared = GitHubService.disconnectProfile();
  assert.strictEqual(cleared.connected, false);
  assert.strictEqual(store.getGitHubProfile().connected, false);
});

test('GitHubService - Verify HMAC-SHA256 Webhook Signatures', () => {
  const secret = 'whsec_testSecretKey12345';
  const rawBody = JSON.stringify({ action: 'push', ref: 'refs/heads/main' });

  const validHash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const validHeader = `sha256=${validHash}`;

  const isValid = GitHubService.verifySignature(rawBody, validHeader, secret);
  assert.strictEqual(isValid, true);

  // Tampered body or invalid hash
  const invalidHeader = 'sha256=wronghash00000000000000000000000000000000000000000000000000000000';
  const isInvalid = GitHubService.verifySignature(rawBody, invalidHeader, secret);
  assert.strictEqual(isInvalid, false);
});

test('GitHubService - Process Push Event & Trigger Jenkins CI/CD Pipeline', () => {
  store.reset();
  GitHubService.connectProfile({ username: 'priyanknamdev', repo: 'core-api' });

  const pushPayload = {
    ref: 'refs/heads/main',
    repository: {
      name: 'core-api',
      full_name: 'priyanknamdev/core-api'
    },
    pusher: { name: 'priyanknamdev' },
    head_commit: {
      id: 'e82b49c0182419a',
      message: 'feat(auth): add OAuth2 refresh token rotation',
      author: { name: 'priyanknamdev' }
    }
  };

  const result = GitHubService.handlePushEvent(pushPayload);

  assert.strictEqual(result.success, true);
  assert.ok(result.pipeline);
  assert.ok(result.pipeline.name.includes('Jenkins CI'));
  assert.strictEqual(result.pipeline.commit, 'e82b49c');
  assert.strictEqual(result.pipeline.branch, 'main');
  assert.strictEqual(result.commitStatus.state, 'pending');

  // Verify event recorded in history
  const events = store.getGitHubEvents();
  assert.ok(events.some(e => e.commitSha === 'e82b49c'));
});

test('GitHub API Route - handleGetGitHubStatus', () => {
  store.reset();
  const res = new MockResponse();
  handleGetGitHubStatus({}, res);

  assert.strictEqual(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.ok(data.profile);
  assert.strictEqual(data.profile.username, 'priyanknamdev');
  assert.ok(Array.isArray(data.recentEvents));
});

test('GitHub API Route - handleConnectGitHub', () => {
  store.reset();
  const res = new MockResponse();
  handleConnectGitHub({}, res, JSON.stringify({ username: 'octocat', repo: 'hello-world' }));

  assert.strictEqual(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.profile.username, 'octocat');
});

test('GitHub API Route - handleGitHubWebhook & Signature Rejection', () => {
  store.reset();
  const profile = store.getGitHubProfile();
  const rawBody = JSON.stringify({ ref: 'refs/heads/main' });

  // 1. Rejected on invalid signature
  const resReject = new MockResponse();
  handleGitHubWebhook({}, resReject, rawBody, { 'x-hub-signature-256': 'sha256=tampered' });
  assert.strictEqual(resReject.statusCode, 401);

  // 2. Accepted on valid signature
  const validHash = crypto.createHmac('sha256', profile.webhookSecret).update(rawBody).digest('hex');
  const resAccept = new MockResponse();
  handleGitHubWebhook({}, resAccept, rawBody, {
    'x-hub-signature-256': `sha256=${validHash}`,
    'x-github-event': 'push'
  });
  assert.strictEqual(resAccept.statusCode, 200);
  assert.strictEqual(JSON.parse(resAccept.body).success, true);
});

test('GitHub API Route - handleSimulateGitHubPush', () => {
  store.reset();
  const res = new MockResponse();
  handleSimulateGitHubPush({}, res, JSON.stringify({
    message: 'test: simulated git push webhook',
    branch: 'main'
  }));

  assert.strictEqual(res.statusCode, 201);
  const data = JSON.parse(res.body);
  assert.strictEqual(data.success, true);
  assert.ok(data.pipeline.id.startsWith('pipe-'));
});

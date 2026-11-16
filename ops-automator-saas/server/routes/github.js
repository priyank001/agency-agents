/**
 * GitHub API Route Handlers
 * Handles profile connection, account validation, webhook listeners,
 * and automated Jenkins CI/CD pipeline triggers.
 */

import { store } from '../services/store.js';
import { GitHubService } from '../services/githubService.js';

export function handleGetGitHubStatus(req, res) {
  const profile = store.getGitHubProfile();
  const events = store.getGitHubEvents();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ profile, recentEvents: events.slice(0, 10) }));
}

export function handleConnectGitHub(req, res, body) {
  try {
    const payload = JSON.parse(body || '{}');
    const profile = GitHubService.connectProfile(payload);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'GitHub account connected and validated successfully.', profile }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export function handleDisconnectGitHub(req, res) {
  const cleared = GitHubService.disconnectProfile();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, message: 'GitHub account disconnected.', profile: cleared }));
}

export function handleGitHubWebhook(req, res, body, headers) {
  try {
    const profile = store.getGitHubProfile();
    const signature = headers['x-hub-signature-256'] || headers['X-Hub-Signature-256'];
    const eventType = headers['x-github-event'] || headers['X-GitHub-Event'] || 'push';

    // Verify HMAC-SHA256 signature if secret and header are present
    if (signature && profile.webhookSecret) {
      const isValid = GitHubService.verifySignature(body, signature, profile.webhookSecret);
      if (!isValid) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid HMAC-SHA256 signature. Webhook rejected.' }));
      }
    }

    if (eventType === 'ping') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, message: 'Pong! Webhook successfully registered.' }));
    }

    const payload = JSON.parse(body || '{}');
    const result = GitHubService.handlePushEvent(payload);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Webhook processing failed', details: err.message }));
  }
}

export function handleSimulateGitHubPush(req, res, body) {
  try {
    const options = JSON.parse(body || '{}');
    const result = GitHubService.simulatePush(options);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export function handleGetGitHubEvents(req, res) {
  const events = store.getGitHubEvents();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(events));
}

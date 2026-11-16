/**
 * OpsAutomator SaaS - Server Entrypoint
 * Zero external dependencies, pure native Node.js 22 high-performance server.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Route handlers
import { handleStats, handleSwitchEnv } from './routes/stats.js';
import { handleGetInfra, handleGenerateIaC, handleDriftCheck } from './routes/infra.js';
import {
  handleGetPipelines,
  handleGetPipeline,
  handleTriggerPipeline,
  handleRollbackPipeline,
  handleGenerateWorkflow
} from './routes/pipelines.js';
import {
  handleGetSRE,
  handleToggleRule,
  handleSimulateIncident,
  handleResolveIncident
} from './routes/sre.js';
import { handleGetMetrics, handleGetLogs } from './routes/observability.js';
import { handleGetFinOps, handleApplyRecommendation } from './routes/finops.js';
import { handleGetSecurity, handleTriggerSecurityScan } from './routes/security.js';
import { handleAgentQuery } from './routes/agent.js';
import { handleExportBundle } from './routes/export.js';
import { handleGetHybrid, handleHybridFailover, handleGetVpnConfig } from './routes/hybrid.js';
import { handleGetIntegrations, handleSyncIntegration, handleGenerateToolConfig } from './routes/integrations.js';
import { handleGetArchetypes, handleGetGlossary, handleBuildBlueprint } from './routes/notech.js';
import { handleRunChaosBattery } from './routes/chaos.js';
import {
  handleGetGitHubStatus,
  handleConnectGitHub,
  handleDisconnectGitHub,
  handleGitHubWebhook,
  handleSimulateGitHubPush,
  handleGetGitHubEvents
} from './routes/github.js';
import { pipelineEngine } from './services/pipelineEngine.js';
import { store } from './services/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIR = path.resolve(__dirname, '../client');
const PORT = process.env.PORT || 3000;

// Set of active SSE connections
const sseClients = new Set();

// Pipe pipeline events directly into SSE
pipelineEngine.subscribe((event, data) => {
  broadcastSSE(event, data);
});

// Broadcast GitHub real-time events & profile changes
store.on('github:event', (data) => {
  broadcastSSE('github:event', data);
});
store.on('github:profile', (data) => {
  broadcastSSE('github:profile', data);
});

// Broadcast periodic telemetry tick (every 3 seconds)
const telemetryTimer = setInterval(() => {
  if (sseClients.size === 0) return;

  const now = new Date();
  const tickData = {
    timestamp: now.toISOString(),
    time: now.toLocaleTimeString(),
    reqPerSec: Math.round(180 + Math.random() * 25),
    p95LatencyMs: Math.round(44 + Math.random() * 10),
    cpuPercent: Math.round(40 + Math.random() * 8),
    memoryPercent: Math.round(58 + Math.random() * 4),
    uptime: store.getTenant().uptime
  };

  broadcastSSE('telemetry:tick', tickData);
}, 3000);
telemetryTimer.unref();

function broadcastSSE(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// MIME type dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8'
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        // 5MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function createServer() {
  return http.createServer(async (req, res) => {
    setCors(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const host = req.headers.host || `localhost:${PORT}`;
    const url = new URL(req.url, `http://${host}`);
    const pathname = url.pathname;

    try {
      // 1. SSE Real-Time Stream
      if (pathname === '/api/events') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });
        res.write(': connected\n\n');
        sseClients.add(res);

        req.on('close', () => {
          sseClients.delete(res);
        });
        return;
      }

      // 2. REST API Routes
      if (pathname.startsWith('/api/')) {
        let body = '';
        if (req.method === 'POST' || req.method === 'PUT') {
          body = await readBody(req);
        }

        // Stats & Tenant
        if (pathname === '/api/stats' && req.method === 'GET') {
          return handleStats(req, res);
        }
        if (pathname === '/api/stats/environment' && req.method === 'POST') {
          return handleSwitchEnv(req, res, body);
        }

        // Infrastructure
        if (pathname === '/api/infra' && req.method === 'GET') {
          return handleGetInfra(req, res, url);
        }
        if (pathname === '/api/infra/generate' && req.method === 'POST') {
          return handleGenerateIaC(req, res, body);
        }
        if (pathname === '/api/infra/drift' && req.method === 'POST') {
          return handleDriftCheck(req, res, body);
        }

        // Pipelines
        if (pathname === '/api/pipelines' && req.method === 'GET') {
          return handleGetPipelines(req, res);
        }
        if (pathname.startsWith('/api/pipelines/') && req.method === 'GET' && pathname !== '/api/pipelines/workflow') {
          return handleGetPipeline(req, res, url);
        }
        if (pathname === '/api/pipelines/trigger' && req.method === 'POST') {
          return handleTriggerPipeline(req, res, body);
        }
        if (pathname === '/api/pipelines/rollback' && req.method === 'POST') {
          return handleRollbackPipeline(req, res, body);
        }
        if (pathname === '/api/pipelines/workflow' && req.method === 'GET') {
          return handleGenerateWorkflow(req, res, url);
        }

        // SRE & Self-Healing
        if (pathname === '/api/sre' && req.method === 'GET') {
          return handleGetSRE(req, res);
        }
        if (pathname === '/api/sre/toggle-rule' && req.method === 'POST') {
          return handleToggleRule(req, res, body);
        }
        if (pathname === '/api/sre/simulate-incident' && req.method === 'POST') {
          return handleSimulateIncident(req, res, body);
        }
        if (pathname === '/api/sre/resolve-incident' && req.method === 'POST') {
          return handleResolveIncident(req, res, body);
        }

        // Observability
        if (pathname === '/api/observability/metrics' && req.method === 'GET') {
          return handleGetMetrics(req, res, url);
        }
        if (pathname === '/api/observability/logs' && req.method === 'GET') {
          return handleGetLogs(req, res, url);
        }

        // FinOps
        if (pathname === '/api/finops' && req.method === 'GET') {
          return handleGetFinOps(req, res);
        }
        if (pathname === '/api/finops/apply' && req.method === 'POST') {
          return handleApplyRecommendation(req, res, body);
        }

        // Security
        if (pathname === '/api/security' && req.method === 'GET') {
          return handleGetSecurity(req, res);
        }
        if (pathname === '/api/security/scan' && req.method === 'POST') {
          return handleTriggerSecurityScan(req, res);
        }

        // AI DevOps Automator Agent
        if (pathname === '/api/agent/query' && req.method === 'POST') {
          return handleAgentQuery(req, res, body);
        }

        // Export bundle
        if (pathname === '/api/export/bundle' && req.method === 'GET') {
          return handleExportBundle(req, res);
        }

        // Hybrid Infrastructure & Mesh
        if (pathname === '/api/hybrid' && req.method === 'GET') {
          return handleGetHybrid(req, res);
        }
        if (pathname === '/api/hybrid/failover' && req.method === 'POST') {
          return handleHybridFailover(req, res, body);
        }
        if (pathname === '/api/hybrid/vpn-config' && req.method === 'GET') {
          return handleGetVpnConfig(req, res);
        }

        // DevOps Tools Integration Hub
        if (pathname === '/api/integrations' && req.method === 'GET') {
          return handleGetIntegrations(req, res);
        }
        if (pathname === '/api/integrations/sync' && req.method === 'POST') {
          return handleSyncIntegration(req, res, body);
        }
        if (pathname === '/api/integrations/generate' && req.method === 'POST') {
          return handleGenerateToolConfig(req, res, body);
        }

        // No-Tech Founder Mode
        if (pathname === '/api/notech/archetypes' && req.method === 'GET') {
          return handleGetArchetypes(req, res);
        }
        if (pathname === '/api/notech/glossary' && req.method === 'GET') {
          return handleGetGlossary(req, res);
        }
        if (pathname === '/api/notech/blueprint' && req.method === 'POST') {
          return handleBuildBlueprint(req, res, body);
        }

        // Chaos & Stress Testing Lab
        if (pathname === '/api/chaos/run' && req.method === 'POST') {
          return handleRunChaosBattery(req, res);
        }

        // GitHub Integration & CI/CD Webhook Trigger
        if (pathname === '/api/github/status' && req.method === 'GET') {
          return handleGetGitHubStatus(req, res);
        }
        if (pathname === '/api/github/connect' && req.method === 'POST') {
          return handleConnectGitHub(req, res, body);
        }
        if (pathname === '/api/github/disconnect' && req.method === 'POST') {
          return handleDisconnectGitHub(req, res);
        }
        if (pathname === '/api/github/webhook' && req.method === 'POST') {
          return handleGitHubWebhook(req, res, body, req.headers);
        }
        if (pathname === '/api/github/simulate-push' && req.method === 'POST') {
          return handleSimulateGitHubPush(req, res, body);
        }
        if (pathname === '/api/github/events' && req.method === 'GET') {
          return handleGetGitHubEvents(req, res);
        }

        // 404 for unknown API routes
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Endpoint not found' }));
      }

      // 3. Static Files Serving
      let filePath = path.join(CLIENT_DIR, pathname === '/' ? 'index.html' : pathname);

      // Safe path resolution inside CLIENT_DIR
      if (!filePath.startsWith(CLIENT_DIR)) {
        res.writeHead(403);
        return res.end('Access Denied');
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(CLIENT_DIR, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      const stream = fs.createReadStream(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      stream.pipe(res);
    } catch (err) {
      console.error('Server error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
    }
  });
}

// Start server if run directly
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('server/index.js') || 
  process.argv[1].endsWith('server/index') ||
  process.argv[1] === fileURLToPath(import.meta.url)
);

if (isDirectRun) {
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 OpsAutomator SaaS Platform running at http://localhost:${PORT}`);
    console.log(`⚙️  Autonomous DevOps & SRE for Startups and Growing Businesses`);
    console.log(`📚 Based on engineering-devops-automator.md specifications`);
    console.log(`======================================================\n`);
  });
}

import { store } from '../services/store.js';

export function handleGetSecurity(req, res) {
  const security = store.getSecurity();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(security));
}

export function handleTriggerSecurityScan(req, res) {
  // Simulate immediate vulnerability scan run
  const sec = store.getSecurity();
  sec.secretsScan.lastScanned = new Date().toISOString();
  sec.secretsScan.repositoriesScanned += 1;

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'Trivy + SAST scan finished with zero critical vulnerabilities.',
    security: sec
  }));
}


import { store } from '../services/store.js';
import { IntegrationsService } from '../services/integrationsService.js';

export function handleGetHybrid(req, res) {
  const hybrid = store.getHybridState();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(hybrid));
}

export function handleHybridFailover(req, res, body) {
  try {
    const { target } = JSON.parse(body || '{}');
    const updated = store.toggleHybridFailover(target || 'onprem');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, hybrid: updated }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export function handleGetVpnConfig(req, res) {
  const config = IntegrationsService.generateHybridVpnConfig();
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(config);
}


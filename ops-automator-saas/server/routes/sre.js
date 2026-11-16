import { store } from '../services/store.js';
import { selfHealingEngine } from '../services/selfHealingEngine.js';

export function handleGetSRE(req, res) {
  const sre = store.getSRE();
  const history = selfHealingEngine.getRemediationHistory();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ...sre, remediationHistory: history }));
}

export function handleToggleRule(req, res, body) {
  try {
    const { ruleId } = JSON.parse(body || '{}');
    const rule = store.toggleSelfHealingRule(ruleId);
    if (!rule) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'rule not found' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, rule }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export function handleSimulateIncident(req, res, body) {
  try {
    const { failureType } = JSON.parse(body || '{}');
    const result = selfHealingEngine.simulateFailureAndHeal(failureType || '5xx_spike');
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, ...result }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export function handleResolveIncident(req, res, body) {
  try {
    const { incidentId } = JSON.parse(body || '{}');
    const resolved = store.resolveIncident(incidentId, false);
    if (!resolved) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'incident not found' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, incident: resolved }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}


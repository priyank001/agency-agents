import { store } from '../services/store.js';

export function handleGetFinOps(req, res) {
  const finops = store.getFinOps();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(finops));
}

export function handleApplyRecommendation(req, res, body) {
  try {
    const { id } = JSON.parse(body || '{}');
    const applied = store.applyRecommendation(id);
    if (!applied) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'recommendation not found or already applied' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      applied,
      newMonthlySpendUSD: store.getFinOps().monthlySpendUSD
    }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}


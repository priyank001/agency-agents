import { devopsAgent } from '../services/devopsAgent.js';

export function handleAgentQuery(req, res, body) {
  try {
    const payload = JSON.parse(body || '{}');
    const prompt = payload.prompt || '';
    const response = devopsAgent.processPrompt(prompt, payload.context || {});

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'failed to process agent prompt', details: err.message }));
  }
}


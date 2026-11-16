import { store } from '../services/store.js';
import { IaCEngine } from '../services/iacEngine.js';

export function handleGetInfra(req, res, url) {
  const env = url.searchParams.get('env') || store.getTenant().currentEnvironment;
  const infra = store.getInfrastructure(env);
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ environment: env, infrastructure: infra }));
}

export function handleGenerateIaC(req, res, body) {
  try {
    const payload = JSON.parse(body || '{}');
    const type = payload.type || 'terraform';
    
    let code = '';
    if (type === 'kubernetes') {
      code = IaCEngine.generateKubernetesManifests(payload);
    } else {
      code = IaCEngine.generateTerraform(payload);
    }

    const compliance = IaCEngine.auditCompliance(code);
    const infracost = IaCEngine.calculateInfracost(payload);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      type,
      code,
      compliance,
      infracost
    }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'failed to generate IaC', details: err.message }));
  }
}

export function handleDriftCheck(req, res, body) {
  const payload = JSON.parse(body || '{}');
  const action = payload.action || 'simulate';
  const env = payload.environment || store.getTenant().currentEnvironment;

  let result;
  if (action === 'remediate') {
    result = store.remediateDrift(env);
  } else {
    result = store.simulateDrift(env);
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, environment: env, driftStatus: result.driftStatus }));
}


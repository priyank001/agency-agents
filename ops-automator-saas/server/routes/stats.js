import { store } from '../services/store.js';

export function handleStats(req, res) {
  const tenant = store.getTenant();
  const infra = store.getInfrastructure();
  const sre = store.getSRE();
  const finops = store.getFinOps();
  const security = store.getSecurity();
  const pipelines = store.getPipelines();

  const data = {
    tenant,
    currentEnvironment: tenant.currentEnvironment,
    kpis: {
      uptime: tenant.uptime,
      mttrMinutes: tenant.mttrMinutes,
      deploymentsToday: tenant.deploymentsToday,
      totalDeployments: tenant.totalDeployments,
      monthlySpendUSD: finops.monthlySpendUSD,
      projectedSavingsUSD: finops.projectedSavingsUSD,
      complianceScore: security.complianceScore,
      activeIncidents: sre.incidents.filter(i => i.status !== 'resolved').length,
      activePipelines: pipelines.filter(p => p.status === 'in-progress').length
    },
    quickHealth: {
      apiCluster: 'healthy',
      database: 'healthy',
      cache: 'healthy',
      loadBalancer: 'healthy',
      selfHealing: 'armed'
    }
  };

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export function handleSwitchEnv(req, res, body) {
  try {
    const { environment } = JSON.parse(body || '{}');
    if (!environment) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'environment required' }));
    }
    const success = store.setEnvironment(environment);
    if (!success) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'invalid environment' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, currentEnvironment: environment }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'malformed body' }));
  }
}


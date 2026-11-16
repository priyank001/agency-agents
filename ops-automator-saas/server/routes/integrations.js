import { store } from '../services/store.js';
import { IntegrationsService } from '../services/integrationsService.js';

export function handleGetIntegrations(req, res) {
  const tools = store.getIntegrations();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(tools));
}

export function handleSyncIntegration(req, res, body) {
  try {
    const { toolId } = JSON.parse(body || '{}');
    const tool = store.syncToolIntegration(toolId);
    if (!tool) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Tool not found' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, tool }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export function handleGenerateToolConfig(req, res, body) {
  try {
    const { tool, appName, buildTool, clusterName } = JSON.parse(body || '{}');
    let content = '';

    if (tool === 'jenkins') {
      content = IntegrationsService.generateJenkinsfile({ appName, buildTool });
    } else if (tool === 'maven') {
      content = IntegrationsService.generateMavenPom(appName);
    } else if (tool === 'ansible') {
      content = IntegrationsService.generateAnsiblePlaybook({ clusterName });
    } else if (tool === 'k6') {
      content = IntegrationsService.generateK6LoadTest({ targetUrl: 'https://api.startup.io' });
    } else if (tool === 'vault') {
      content = IntegrationsService.generateVaultConfig(appName);
    } else {
      content = `# Integration config for ${tool}`;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ tool, content }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}


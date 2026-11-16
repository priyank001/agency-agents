import { store } from '../services/store.js';
import { pipelineEngine, PipelineEngine } from '../services/pipelineEngine.js';

export function handleGetPipelines(req, res) {
  const pipelines = store.getPipelines();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(pipelines));
}

export function handleGetPipeline(req, res, url) {
  const id = url.pathname.split('/').pop();
  const pipeline = store.getPipeline(id);
  if (!pipeline) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'pipeline not found' }));
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(pipeline));
}

export function handleTriggerPipeline(req, res, body) {
  try {
    const options = JSON.parse(body || '{}');
    const pipeline = pipelineEngine.startSimulationRun(options);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, pipeline }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export function handleRollbackPipeline(req, res, body) {
  try {
    const { pipelineId } = JSON.parse(body || '{}');
    const rolledBack = pipelineEngine.simulateRollback(pipelineId);
    if (!rolledBack) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'pipeline not found for rollback' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, pipeline: rolledBack }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export function handleGenerateWorkflow(req, res, url) {
  const appName = url.searchParams.get('app') || 'paystream-api';
  const yaml = PipelineEngine.generateGitHubActionsYaml(appName);
  res.writeHead(200, { 'Content-Type': 'text/yaml' });
  res.end(yaml);
}


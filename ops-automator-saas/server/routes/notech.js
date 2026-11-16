import { NoTechWizard } from '../services/noTechWizard.js';

export function handleGetArchetypes(req, res) {
  const archetypes = NoTechWizard.getArchetypes();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(archetypes));
}

export function handleGetGlossary(req, res) {
  const glossary = NoTechWizard.getGlossary();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(glossary));
}

export function handleBuildBlueprint(req, res, body) {
  try {
    const payload = JSON.parse(body || '{}');
    const blueprint = NoTechWizard.buildStartupBlueprint(payload);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(blueprint));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}


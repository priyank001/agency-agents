import { StressTestingEngine } from '../services/stressTestingEngine.js';

export function handleRunChaosBattery(req, res) {
  try {
    const report = StressTestingEngine.runBattery();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(report));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Stress testing failed', message: err.message }));
  }
}


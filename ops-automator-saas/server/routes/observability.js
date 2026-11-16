import { store } from '../services/store.js';

export function handleGetMetrics(req, res, url) {
  const format = url.searchParams.get('format') || 'json';

  if (format === 'prometheus') {
    const rawPrometheus = `# HELP http_requests_total Total number of HTTP requests made.
# TYPE http_requests_total counter
http_requests_total{status="200",handler="/api/v1/payments"} 128490
http_requests_total{status="201",handler="/api/v1/orders"} 34210
http_requests_total{status="400",handler="/api/v1/auth"} 142
http_requests_total{status="500",handler="/api/v1/payments"} 4

# HELP http_request_duration_seconds Histogram of HTTP request latency.
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.05"} 142000
http_request_duration_seconds_bucket{le="0.1"} 159000
http_request_duration_seconds_bucket{le="0.25"} 162500
http_request_duration_seconds_bucket{le="0.5"} 162800
http_request_duration_seconds_bucket{le="+Inf"} 162846
http_request_duration_seconds_sum 12402.4
http_request_duration_seconds_count 162846

# HELP cpu_utilization_percent Average CPU utilization across cluster.
# TYPE cpu_utilization_percent gauge
cpu_utilization_percent{cluster="production-cluster",az="us-east-1a"} 42.6
cpu_utilization_percent{cluster="production-cluster",az="us-east-1b"} 44.1

# HELP memory_utilization_percent Memory utilization.
# TYPE memory_utilization_percent gauge
memory_utilization_percent{cluster="production-cluster"} 58.3
`;
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
    return res.end(rawPrometheus);
  }

  // Generate real-time synthetic timeseries for past 15 points
  const now = Date.now();
  const timeseries = [];
  for (let i = 14; i >= 0; i--) {
    const t = new Date(now - i * 15000);
    // Add realistic subtle jitter
    const jitter = Math.sin(i * 0.8) * 12;
    timeseries.push({
      time: t.toLocaleTimeString(),
      timestamp: t.toISOString(),
      reqPerSec: Math.round(180 + jitter + Math.random() * 15),
      p95LatencyMs: Math.round(48 + Math.random() * 8),
      p99LatencyMs: Math.round(112 + Math.random() * 18),
      cpuPercent: Math.round(42 + jitter * 0.4 + Math.random() * 5),
      memoryPercent: Math.round(58 + Math.random() * 3),
      errorRatePercent: (Math.random() * 0.04).toFixed(3)
    });
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    tenant: store.getTenant().name,
    environment: store.getTenant().currentEnvironment,
    alertRules: store.observability.alertRules,
    metrics: timeseries
  }));
}

export function handleGetLogs(req, res, url) {
  const service = url.searchParams.get('service') || 'all';
  const level = url.searchParams.get('level') || 'all';

  const logs = [
    { timestamp: new Date(Date.now() - 1000 * 5).toISOString(), level: 'info', service: 'core-api', message: 'POST /v1/checkout 200 OK (38ms) - customer_id=cust_8932' },
    { timestamp: new Date(Date.now() - 1000 * 12).toISOString(), level: 'info', service: 'alb-ingress', message: 'HTTP 200 GET /health - TargetGroup healthy' },
    { timestamp: new Date(Date.now() - 1000 * 25).toISOString(), level: 'info', service: 'auth-svc', message: 'Token refresh verified for user session_992' },
    { timestamp: new Date(Date.now() - 1000 * 42).toISOString(), level: 'warn', service: 'cache-redis', message: 'Connection pool near 70% threshold (42/60 connections active)' },
    { timestamp: new Date(Date.now() - 1000 * 60).toISOString(), level: 'info', service: 'core-api', message: 'Auto-scaling group heartbeat acknowledged by CloudWatch agent' },
    { timestamp: new Date(Date.now() - 1000 * 85).toISOString(), level: 'info', service: 'worker-queue', message: 'Processed batch 442 (180 webhook events dispatched)' }
  ];

  let filtered = logs;
  if (service !== 'all') {
    filtered = filtered.filter(l => l.service === service);
  }
  if (level !== 'all') {
    filtered = filtered.filter(l => l.level === level);
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(filtered));
}


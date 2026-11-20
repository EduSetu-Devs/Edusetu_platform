const { getMetrics } = require('../middleware/metricsMiddleware');

const getMetricsEndpoint = (req, res) => {
  const token = process.env.METRICS_TOKEN;
  if (token) {
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${token}`) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  }

  const m = getMetrics();
  const uptimeSeconds = Math.floor(process.uptime());
  const mem = process.memoryUsage();
  const lines = [];
  lines.push('# HELP edusetu_requests_total Total HTTP requests');
  lines.push('# TYPE edusetu_requests_total counter');
  lines.push(`edusetu_requests_total ${m.requestsTotal}`);
  lines.push('# HELP edusetu_errors_total Total 5xx responses');
  lines.push('# TYPE edusetu_errors_total counter');
  lines.push(`edusetu_errors_total ${m.errorsTotal}`);
  lines.push('# HELP edusetu_request_latency_ms_sum Sum of request latency in ms');
  lines.push('# TYPE edusetu_request_latency_ms_sum counter');
  lines.push(`edusetu_request_latency_ms_sum ${m.latencySumMs.toFixed(2)}`);
  lines.push('# HELP edusetu_request_latency_ms_count Number of measured requests');
  lines.push('# TYPE edusetu_request_latency_ms_count counter');
  lines.push(`edusetu_request_latency_ms_count ${m.latencyCount}`);
  lines.push('# HELP edusetu_uptime_seconds Process uptime in seconds');
  lines.push('# TYPE edusetu_uptime_seconds gauge');
  lines.push(`edusetu_uptime_seconds ${uptimeSeconds}`);
  lines.push('# HELP edusetu_memory_rss_bytes Resident set size in bytes');
  lines.push('# TYPE edusetu_memory_rss_bytes gauge');
  lines.push(`edusetu_memory_rss_bytes ${mem.rss}`);
  lines.push('# HELP edusetu_memory_heap_used_bytes Heap used in bytes');
  lines.push('# TYPE edusetu_memory_heap_used_bytes gauge');
  lines.push(`edusetu_memory_heap_used_bytes ${mem.heapUsed}`);

  for (const [status, count] of Object.entries(m.requestsByStatus)) {
    lines.push(`edusetu_requests_by_status{status="${status}"} ${count}`);
  }

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.status(200).send(lines.join('\n') + '\n');
};

module.exports = { getMetricsEndpoint };
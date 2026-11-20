const metrics = {
  requestsTotal: 0,
  requestsByStatus: {},
  requestsByRoute: {},
  errorsTotal: 0,
  latencySumMs: 0,
  latencyCount: 0,
  startedAt: Date.now()
};

const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    metrics.requestsTotal += 1;
    const status = String(res.statusCode);
    metrics.requestsByStatus[status] = (metrics.requestsByStatus[status] || 0) + 1;
    const route = req.route && req.route.path ? `${req.method} ${req.baseUrl || ''}${req.route.path}` : `${req.method} ${req.path}`;
    metrics.requestsByRoute[route] = (metrics.requestsByRoute[route] || 0) + 1;
    if (res.statusCode >= 500) metrics.errorsTotal += 1;
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    metrics.latencySumMs += durationMs;
    metrics.latencyCount += 1;
  });
  next();
};

const getMetrics = () => metrics;

module.exports = { metricsMiddleware, getMetrics };
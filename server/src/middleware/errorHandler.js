const { errorResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * 404 Not Found Middleware
 * Triggered when a requested endpoint does not match any route
 */
const notFoundHandler = (req, res, next) => {
  return errorResponse(
    res,
    404,
    `Resource not found: [${req.method}] ${req.originalUrl}`
  );
};

/**
 * Global Error Handling Middleware
 * Catches all unhandled synchronous and asynchronous errors
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Genericize 500 internal errors in production to avoid leaking database or stack details
  let clientMessage = err.message || 'Internal Server Error';
  if (isProd && statusCode >= 500) {
    clientMessage = 'An internal server error occurred. Please try again later.';
  }

  logger.error({ requestId: req.id, traceId: req.traceContext && req.traceContext.traceId, method: req.method, url: req.originalUrl, statusCode, err: err.message, stack: !isProd ? err.stack : undefined }, 'Unhandled request error');
  if (!isProd && err.stack) {
    // stack already logged above in non-prod
  }

  return res.status(statusCode).json({
    success: false,
    message: clientMessage,
    requestId: req.id || undefined,
    stack: !isProd ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};

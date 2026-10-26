const { errorResponse } = require('../utils/responseHandler');

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
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.originalUrl} - ${message}`);
  if (process.env.NODE_ENV === 'development' && err.stack) {
    console.error(err.stack);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};

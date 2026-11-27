const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
const apiRoutes = require('./routes/apiRoutes');
const { metricsMiddleware } = require('./middleware/metricsMiddleware');
const { getMetricsEndpoint } = require('./controllers/metricsController');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { getClient: getRedisClient } = require('./services/redisClient');
const { traceContextMiddleware } = require('./middleware/traceContext');
const { csrfProtection } = require('./utils/authCookie');
let RedisStore = null;
try { RedisStore = require('rate-limit-redis').RedisStore; } catch (e) { RedisStore = null; }

const buildStore = (prefix) => {
  const client = getRedisClient();
  if (!client || !RedisStore) return undefined;
  return new RedisStore({
    sendCommand: (...args) => client.call(...args),
    prefix: `rl:${prefix}:`
  });
};
const { createCorsOriginValidator } = require('./utils/originUtils');

const isProduction = process.env.NODE_ENV === 'production';

// Initialize express app
const app = express();

// Trust reverse proxy (e.g. Render load balancer, Nginx, Cloudflare)
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Middleware: Request Correlation ID (Observability)
app.use((req, res, next) => {
  const incomingRequestId = req.headers['x-request-id'];
  const reqId = typeof incomingRequestId === 'string' && /^[A-Za-z0-9._:-]{1,100}$/.test(incomingRequestId)
    ? incomingRequestId
    : crypto.randomUUID();
  req.id = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
});

// Middleware: W3C Trace Context (lightweight distributed tracing)
app.use(traceContextMiddleware);

// Security Middleware: Helmet security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", 'https://apis.google.com', 'https://www.gstatic.com'],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        mediaSrc: ["'self'", 'blob:'],
        frameSrc: ["'self'", 'https://*.firebaseapp.com', 'https://accounts.google.com'],
        connectSrc: [
          "'self'",
          ...(isProduction ? ['https:', 'wss:'] : ['http://localhost:*', 'ws://localhost:*', 'http://127.0.0.1:*', 'ws://127.0.0.1:*'])
        ],
        workerSrc: ["'self'", 'blob:'],
        upgradeInsecureRequests: isProduction ? [] : null
      }
    },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginEmbedderPolicy: false,
    strictTransportSecurity: isProduction
      ? { maxAge: 15552000, includeSubDomains: true, preload: false }
      : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  })
);

// Middleware: Enable CORS with an explicit allow-list
app.use(
  cors({
    origin: createCorsOriginValidator(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 600
  })
);

// Rate Limiter: General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000, // Limit each IP to 3000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('api'),
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    timestamp: new Date().toISOString()
  }
});
app.use(metricsMiddleware);

// Mount General API Rate Limiter
app.use('/api', apiLimiter);

// Rate Limiter: Stricter for Auth endpoints (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('auth'),
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again later',
    timestamp: new Date().toISOString()
  }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Rate Limiter: Protect OTP endpoints against email/SMS bombing
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('otp'),
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many OTP requests from this IP, please try again after 15 minutes',
    timestamp: new Date().toISOString()
  }
});
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/verify-otp', authLimiter);

// Rate Limiter: Admin portal verification is a high-value target
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('admin'),
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many admin verification attempts from this IP, please try again later',
    timestamp: new Date().toISOString()
  }
});
app.use('/api/auth/admin/verify', adminLimiter);
app.use('/api/auth/admin/login', adminLimiter);
app.use('/api/auth/verify-admin-password', adminLimiter);

// Middleware: Request body parsing with safe limits (1mb for JSON; file uploads use streaming Multer)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// CSRF protection for cookie-authenticated state-changing requests
app.use(csrfProtection);

// Authentication responses must never be cached by browsers, proxies, or CDNs
app.use('/api/auth', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  next();
});

// Middleware: Structured request logging (pino) with request correlation
if (process.env.NODE_ENV !== 'test') {
  app.use(pinoHttp({
    logger,
    autoLogging: true,
    customProps: (req) => ({ requestId: req.id, traceId: req.traceContext && req.traceContext.traceId, spanId: req.traceContext && req.traceContext.spanId }),
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    }
  }));
}

// Mount Main API Router under /api
app.use('/api', apiRoutes);

// Serve frontend static build if present
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Root entry route fallback for API-only mode
  app.get('/', (req, res) => {
    res.json({
      project: 'EduSetu',
      status: 'Running',
      version: '1.0.0 (Production Hardened)',
      message: 'Welcome to EduSetu Backend Server',
      documentation: 'See README.md for endpoint details',
      healthCheck: '/api/health'
    });
  });
}

// Prometheus-style metrics endpoint (protected by METRICS_TOKEN in production)
app.get('/api/metrics', getMetricsEndpoint);
app.use(notFoundHandler);

// Middleware: Global error handler
app.use(errorHandler);

module.exports = app;

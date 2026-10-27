const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const apiRoutes = require('./routes/apiRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Default AI configuration for cloud deployment (Render) if not set in cloud dashboard
if (!process.env.AI_API_KEY && process.env.NODE_ENV !== 'test') {
  process.env.AI_PROVIDER = process.env.AI_PROVIDER || 'openai';
  // Fallback cloud AI key
  process.env.AI_API_KEY = Buffer.from('c2stb3ItdjEtMzE4NWUyOWMwMTRmMzg0NGI2NmVlODM5ZjdiOThkM2U4MzdlY2MzYTU3NDg3NGI3NjU5OWM1MTJiNTBkM2M4NA==', 'base64').toString('utf8');
  process.env.AI_MODEL = process.env.AI_MODEL || 'openrouter/free';
  process.env.AI_API_URL = process.env.AI_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
}

// Initialize express app
const app = express();

// Security Middleware: Helmet security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// Middleware: Enable CORS with configurable origins
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: [clientOrigin, 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Rate Limiter: General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000, // Limit each IP to 3000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    timestamp: new Date().toISOString()
  }
});
app.use('/api', apiLimiter);

// Rate Limiter: Stricter for Auth endpoints (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again later',
    timestamp: new Date().toISOString()
  }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Middleware: Request body parsing with safe limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware: Request logging (clean dev format, non-test)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
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

// Middleware: 404 handler for unmatched routes
app.use(notFoundHandler);

// Middleware: Global error handler
app.use(errorHandler);

module.exports = app;

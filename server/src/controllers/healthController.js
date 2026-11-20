const { sequelize, getDBStatus } = require('../config/db');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Check overall backend server health status
 * @route GET /api/health
 */
const getHealth = (req, res) => {
  const dbStatus = getDBStatus();

  const healthData = {
    service: 'EduSetu Backend API',
    status: dbStatus.isConnected ? 'online' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus.isConnected ? 'connected' : 'disconnected'
    },
    version: '1.0.0'
  };

  if (!dbStatus.isConnected) {
    return errorResponse(res, 503, 'EduSetu API is degraded - Database disconnected', healthData);
  }

  return successResponse(res, 200, 'EduSetu API is healthy and operational', healthData);
};

/**
 * Check MySQL and Sequelize database health & verify tables
 * @route GET /api/health/db
 */
const getDatabaseHealth = async (req, res) => {
  try {
    // Attempt authentication with MySQL server
    await sequelize.authenticate();

    const dbHealthData = {
      isConnected: true,
      status: 'connected'
    };

    return successResponse(res, 200, 'MySQL database and Sequelize connection are healthy', dbHealthData);
  } catch (error) {
    const offlineData = {
      isConnected: false,
      status: 'disconnected',
      error: error.message
    };

    return errorResponse(res, 503, 'Database health check failed (MySQL Disconnected)', offlineData);
  }
};

/**
 * Get API welcome overview and available features roadmap
 * @route GET /api
 */
const getApiOverview = (req, res) => {
  const overview = {
    platform: 'EduSetu Education Communication Platform',
    description: 'Bridging Teachers, Students, and Parents through organized communication',
    roles: ['admin', 'teacher', 'student', 'parent'],
    version: '1.0.0',
    status: 'Step 2 Verified',
    endpoints: {
      overview: '/api',
      health: '/api/health',
      dbHealth: '/api/health/db',
      auth: '/api/auth'
    }
  };

  return successResponse(res, 200, 'Welcome to EduSetu REST API', overview);
};

const getLiveness = (req, res) => {
  return res.status(200).json({
    success: true,
    status: 'alive',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
};

const getReadiness = async (req, res) => {
  try {
    await sequelize.authenticate();
    return res.status(200).json({
      success: true,
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      status: 'not_ready',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getHealth,
  getDatabaseHealth,
  getApiOverview,
  getLiveness,
  getReadiness
};

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
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      dialect: dbStatus.dialect,
      name: dbStatus.database,
      status: dbStatus.isConnected ? 'connected' : 'disconnected'
    },
    version: '1.0.0'
  };

  return successResponse(res, 200, 'EduSetu API is healthy and operational', healthData);
};

/**
 * Check MySQL and Sequelize database health & verify tables
 * @route GET /api/health/db
 */
const getDatabaseHealth = async (req, res) => {
  const dbStatus = getDBStatus();

  try {
    // Attempt authentication with MySQL server
    await sequelize.authenticate();

    // Check existing tables in the database
    let tables = [];
    try {
      tables = await sequelize.getQueryInterface().showAllTables();
    } catch (tblErr) {
      tables = [];
    }

    const usersTableExists = tables.includes('users') || tables.includes('Users');

    const dbHealthData = {
      database: dbStatus.database,
      dialect: dbStatus.dialect,
      host: dbStatus.host,
      port: dbStatus.port,
      user: dbStatus.user,
      isConnected: true,
      status: 'connected',
      tablesFound: tables,
      usersTableExists: usersTableExists,
      userModel: {
        modelName: User.name,
        tableName: User.getTableName(),
        attributes: Object.keys(User.rawAttributes)
      }
    };

    return successResponse(res, 200, 'MySQL database and Sequelize connection are healthy', dbHealthData);
  } catch (error) {
    const offlineData = {
      database: dbStatus.database,
      dialect: dbStatus.dialect,
      host: dbStatus.host,
      port: dbStatus.port,
      isConnected: false,
      status: 'disconnected',
      error: error.message,
      troubleshooting: {
        step1: 'Ensure MySQL server (e.g. MYSQL80) is running locally.',
        step2: 'Check port 3306 and database credentials in server/.env.',
        step3: 'To start MySQL on Windows: Open Administrator PowerShell and run "net start MYSQL80".'
      }
    };

    return successResponse(res, 200, 'Database health check completed (MySQL Disconnected / Offline Mode)', offlineData);
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
      testDb: '/api/test/db',
      testUserSchema: '/api/test/user-schema',
      auth: '/api/auth (Planned - Step 3)',
      users: '/api/users (Planned)',
      notices: '/api/notices (Planned)',
      messages: '/api/messages (Planned)'
    }
  };

  return successResponse(res, 200, 'Welcome to EduSetu REST API', overview);
};

module.exports = {
  getHealth,
  getDatabaseHealth,
  getApiOverview
};

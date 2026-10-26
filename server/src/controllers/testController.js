const { sequelize, getDBStatus } = require('../config/db');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Test Database Connection Status
 * @route GET /api/test/db
 */
const testDatabaseConnection = async (req, res) => {
  const dbStatus = getDBStatus();

  try {
    await sequelize.authenticate();

    return successResponse(res, 200, 'Sequelize MySQL connection is active and responding', {
      databaseStatus: 'connected',
      isConnected: true,
      dialect: dbStatus.dialect,
      database: dbStatus.database,
      host: dbStatus.host,
      port: dbStatus.port
    });
  } catch (error) {
    return successResponse(res, 200, 'MySQL connection status test completed (Disconnected)', {
      databaseStatus: 'disconnected',
      isConnected: false,
      dialect: dbStatus.dialect,
      database: dbStatus.database,
      host: dbStatus.host,
      port: dbStatus.port,
      error: error.message,
      instructions: {
        step1: 'Ensure MySQL (e.g. MYSQL80 service) is running locally.',
        step2: 'Start MySQL in Windows: Open Admin PowerShell and run "net start MYSQL80".',
        step3: 'Configure DB_USER and DB_PASSWORD in server/.env.',
        step4: 'Restart backend server (npm run dev).'
      }
    });
  }
};

/**
 * Test User Sequelize Model Schema Validation (In-memory validation)
 * @route GET /api/test/user-schema
 */
const testUserSchema = async (req, res) => {
  try {
    // Build an in-memory User instance (does not insert into DB)
    const testUser = User.build({
      name: '  Rahul Sharma  ',
      email: 'Rahul.Sharma@Example.COM  ',
      password: 'securePassword123',
      role: 'teacher',
      phone: '9876543210'
    });

    // Run Sequelize validation
    await testUser.validate();

    const safeOutput = testUser.toJSON();

    return successResponse(res, 200, 'User model schema validation passed successfully', {
      modelName: User.name,
      tableName: User.getTableName(),
      sampleInput: {
        rawName: '  Rahul Sharma  ',
        rawEmail: 'Rahul.Sharma@Example.COM  ',
        role: 'teacher'
      },
      validatedOutput: {
        name: testUser.name,
        email: testUser.email,
        role: testUser.role,
        isActive: testUser.isActive,
        phone: testUser.phone,
        passwordHiddenInToJSON: !safeOutput.password
      },
      attributes: Object.keys(User.rawAttributes),
      roleValues: ['student', 'teacher', 'parent', 'admin']
    });
  } catch (error) {
    return errorResponse(res, 400, 'User schema validation error', {
      error: error.message,
      errors: error.errors?.map((e) => ({ field: e.path, message: e.message }))
    });
  }
};

module.exports = {
  testDatabaseConnection,
  testUserSchema
};

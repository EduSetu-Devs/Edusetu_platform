const path = require('path');
const dotenv = require('dotenv');

// Ensure environment variables are loaded regardless of import order
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

// Load database configuration from environment variables
const DB_NAME = process.env.DB_NAME || 'edusetu';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT, 10) || 3306;
const DB_DIALECT = process.env.DB_DIALECT || 'mysql';
const useSSL = process.env.DB_SSL === 'true' || DB_HOST.includes('tidbcloud.com') || DB_HOST.includes('aivencloud.com');

// Initialize Sequelize instance
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,
  logging: false, // Clean console logging
  dialectOptions: useSSL ? {
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  } : {},
  pool: {
    max: 5,
    min: 0,
    acquire: 10000,
    idle: 10000
  },
  retry: {
    max: 2 // Quick fail if database is not running to avoid blocking server start
  }
});

let isConnected = false;
let connectionError = null;

/**
 * Ensure MySQL database exists before initializing Sequelize
 */
const ensureDatabaseExists = async () => {
  try {
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      ssl: useSSL ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await connection.end();
    return true;
  } catch (err) {
    // Return false and let sequelize handle the detailed error
    return false;
  }
};

/**
 * Test and establish MySQL database connection via Sequelize
 */
const connectDB = async () => {
  try {
    // 1. Ensure the database exists in MySQL
    await ensureDatabaseExists();

    // 2. Authenticate with Sequelize
    await sequelize.authenticate();
    isConnected = true;
    connectionError = null;
    console.log(`[Database] Sequelize successfully connected to MySQL database: ${DB_NAME} at ${DB_HOST}:${DB_PORT}`);

    // 3. Sync database models (creates tables such as 'users' if they don't exist)
    try {
      await sequelize.sync();
      console.log('[Database] Database tables synchronized successfully.');
    } catch (syncErr) {
      console.warn('[Database] Model sync notice (continuing with existing schema):', syncErr.message);
    }
    try {
      await ensureGradingColumns();
    } catch (colErr) {
      console.log('[Database] ensureGradingColumns notice:', colErr.message);
    }
    try {
      await ensureMarketplaceSchema();
    } catch (schemaErr) {
      console.log('[Database] ensureMarketplaceSchema notice:', schemaErr.message);
    }

    return {
      connected: true,
      database: DB_NAME,
      host: DB_HOST,
      port: DB_PORT
    };
  } catch (error) {
    isConnected = false;
    connectionError = error.message;
    console.warn('----------------------------------------------------');
    console.warn(`⚠️  [Database Status] MySQL database connection issue.`);
    console.warn(`    Target: ${DB_DIALECT}://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    console.warn(`    Error: ${error.message}`);
    console.warn('    The server will continue running in offline database mode.');
    console.warn('    If password is required, set DB_PASSWORD in server/.env and restart.');
    console.warn('----------------------------------------------------');

    return {
      connected: false,
      error: error.message
    };
  }
};

const ensureGradingColumns = async () => {
  const columns = [
    { table: 'homeworks', name: 'maxMarks', definition: 'DECIMAL(8,2) NOT NULL DEFAULT 10' },
    { table: 'homework_submissions', name: 'marksObtained', definition: 'DECIMAL(8,2) NULL' },
    { table: 'homework_submissions', name: 'teacherFeedback', definition: 'TEXT NULL' },
    { table: 'homework_submissions', name: 'gradedAt', definition: 'DATETIME NULL' },
    { table: 'homework_submissions', name: 'gradedBy', definition: 'INT NULL' }
  ];

  for (const column of columns) {
    const [rows] = await sequelize.query(
      'SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1',
      { replacements: [column.table, column.name] }
    );
    if (rows.length === 0) {
      await sequelize.query(`ALTER TABLE \`${column.table}\` ADD COLUMN \`${column.name}\` ${column.definition}`);
    }
  }
};

const ensureMarketplaceSchema = async () => {
  if (sequelize.getDialect() !== 'mysql') return;

  const columns = [
    { name: 'scheduledDate', definition: 'DATE NULL' },
    { name: 'startTime', definition: 'TIME NULL' },
    { name: 'endTime', definition: 'TIME NULL' }
  ];
  for (const column of columns) {
    const [rows] = await sequelize.query(
      'SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1',
      { replacements: ['tutor_requests', column.name] }
    );
    if (rows.length === 0) {
      await sequelize.query(`ALTER TABLE \`tutor_requests\` ADD COLUMN \`${column.name}\` ${column.definition}`);
    }
  }

  const [roleColumns] = await sequelize.query(
    "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role' LIMIT 1"
  );
  if (roleColumns.length && !roleColumns[0].COLUMN_TYPE.includes("'school'")) {
    await sequelize.query(
      "ALTER TABLE `users` MODIFY COLUMN `role` ENUM('student','teacher','parent','school','admin') NOT NULL DEFAULT 'student'"
    );
  }

  const sessionColumns = [
    { name: 'bookingStatus', definition: "ENUM('REQUESTED','CONFIRMED','REJECTED','CANCELLED') NULL" },
    { name: 'tutorRequestId', definition: 'INT NULL' },
    { name: 'cancellationReason', definition: 'VARCHAR(500) NULL' }
  ];
  for (const column of sessionColumns) {
    const [rows] = await sequelize.query(
      'SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1',
      { replacements: ['teaching_sessions', column.name] }
    );
    if (rows.length === 0) {
      await sequelize.query(`ALTER TABLE \`teaching_sessions\` ADD COLUMN \`${column.name}\` ${column.definition}`);
    }
  }

  const [sessionIndexes] = await sequelize.query(
    "SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teaching_sessions' AND INDEX_NAME = 'idx_teaching_sessions_tutor_request_id' LIMIT 1"
  );
  if (sessionIndexes.length === 0) {
    await sequelize.query('CREATE INDEX `idx_teaching_sessions_tutor_request_id` ON `teaching_sessions` (`tutorRequestId`)');
  }
  await sequelize.query(
    "UPDATE `teaching_sessions` ts INNER JOIN `tutor_requests` tr ON tr.`teachingSessionId` = ts.`id` SET ts.`tutorRequestId` = tr.`id` WHERE ts.`tutorRequestId` IS NULL"
  );
  await sequelize.query(
    "UPDATE `teaching_sessions` SET `bookingStatus` = CASE WHEN `status` = 'CANCELLED' THEN 'CANCELLED' ELSE 'CONFIRMED' END WHERE `tutorRequestId` IS NOT NULL AND `bookingStatus` IS NULL"
  );
};

/**
 * Get current database status summary
 */
const getDBStatus = () => {
  return {
    isConnected,
    dialect: DB_DIALECT,
    database: DB_NAME,
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    error: connectionError
  };
};

module.exports = {
  sequelize,
  connectDB,
  getDBStatus
};

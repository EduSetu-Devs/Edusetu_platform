const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT, 10) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
const DB_NAME = process.env.DB_NAME || 'edusetu';
const useSSL = process.env.DB_SSL === 'true' || DB_HOST.includes('tidbcloud.com') || DB_HOST.includes('aivencloud.com');

const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

const run = async () => {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true,
    ssl: useSSL ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined
  });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT NOT NULL AUTO_INCREMENT,
        filename VARCHAR(255) NOT NULL,
        appliedAt DATETIME NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY schema_migrations_filename_unique (filename)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [appliedRows] = await connection.query('SELECT filename FROM schema_migrations');
    const applied = new Set(appliedRows.map((row) => row.filename));

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((name) => name.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[migrate] Skipping already-applied migration: ${file}`);
        continue;
      }
      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      console.log(`[migrate] Applying migration: ${file}`);
      try {
        await connection.query(sql);
      } catch (err) {
        // If columns/tables/indexes already exist from previous manual/ORM syncs, treat as idempotent
        if (err.code === 'ER_DUP_FIELDNAME' || err.message.includes('Duplicate column name') || err.message.includes('already exists')) {
          console.warn(`[migrate] Notice: Schema element in ${file} already exists (${err.message}). Marking as applied.`);
        } else {
          throw err;
        }
      }
      await connection.query('INSERT INTO schema_migrations (filename, appliedAt) VALUES (?, ?)', [file, new Date()]);
      console.log(`[migrate] Applied: ${file}`);
    }

    console.log('[migrate] All migrations are up to date.');
  } finally {
    await connection.end();
  }
};

run().catch((error) => {
  console.error('[migrate] Migration failed:', error.message);
  process.exit(1);
});
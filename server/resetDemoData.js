const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sequelize } = require('./src/config/db');

/**
 * EduSetu Safe Demo Data Reset Script
 * Clears test/demo records while preserving all database schemas, tables, relationships, and configurations.
 */

const ALLOWED_LOCAL_HOSTS = ['127.0.0.1', 'localhost', '::1'];
const EXPECTED_DB_NAME = 'edusetu';

async function resetDemoData() {
  console.log('================================================================');
  console.log('🧹 EduSetu Demo Data Reset & Fresh State Utility');
  console.log('================================================================\n');

  // 1. Production & Local Safety Verification
  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbName = process.env.DB_NAME || 'edusetu';
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (!ALLOWED_LOCAL_HOSTS.includes(dbHost) || dbName.toLowerCase() !== EXPECTED_DB_NAME) {
    console.error('⛔ SAFETY ABORT: Database does not match expected local development target.');
    console.error(`   Current Host: ${dbHost}`);
    console.error(`   Current Database: ${dbName}`);
    console.error('   Reset script is strictly restricted to local development environments.\n');
    process.exit(1);
  }

  // 2. Explicit Confirmation Guard
  const args = process.argv.slice(2);
  const isConfirmed = args.includes('--confirm') || process.env.CONFIRM_RESET === 'true';

  if (!isConfirmed) {
    console.warn('⚠️  SAFETY WARNING: This command will erase all test/demo data in the database.');
    console.warn('   Database tables, schemas, migrations, and relationships will be preserved.');
    console.warn('   To proceed with data reset, run:\n');
    console.log('   node server/resetDemoData.js --confirm\n');
    process.exit(0);
  }

  try {
    // 3. Connect to Database
    await sequelize.authenticate();
    console.log(`✅ Connected to local database: [${dbName}] at ${dbHost}\n`);

    // Tables in reverse dependency order
    const tableList = [
      'audit_logs',
      'notifications',
      'messages',
      'conversations',
      'marks',
      'attendances',
      'homework_submissions',
      'homeworks',
      'parent_students',
      'student_profiles',
      'teacher_profiles',
      'parent_profiles',
      'admin_profiles',
      'subjects',
      'sections',
      'classes',
      'users'
    ];

    console.log('⏳ Clearing application demo records...\n');

    // Disable foreign key checks for clean truncation/deletion
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    const results = [];

    for (const table of tableList) {
      try {
        // Count before
        const [countRes] = await sequelize.query(`SELECT COUNT(*) as cnt FROM \`${table}\`;`);
        const count = countRes[0]?.cnt || 0;

        // Delete all data and reset auto increment
        await sequelize.query(`DELETE FROM \`${table}\`;`);
        try {
          await sequelize.query(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1;`);
        } catch (e) {
          // Some table engines or views might ignore auto increment reset
        }

        results.push({ table, deletedCount: count, status: 'CLEARED' });
      } catch (err) {
        results.push({ table, deletedCount: 0, status: `SKIPPED (${err.message})` });
      }
    }

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('----------------------------------------------------------------');
    console.log('📊 DATA RESET SUMMARY');
    console.log('----------------------------------------------------------------');
    let totalCleared = 0;
    results.forEach((r) => {
      console.log(`   • ${r.table.padEnd(25)} : ${String(r.deletedCount).padStart(5)} rows deleted [${r.status}]`);
      totalCleared += r.deletedCount;
    });
    console.log('----------------------------------------------------------------');
    console.log(`✨ Total Records Cleared: ${totalCleared}`);
    console.log('🛡️  All database tables, columns, indexes, and foreign keys PRESERVED.');
    console.log('================================================================\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to reset demo data:', error.message);
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
      await sequelize.close();
    } catch (e) {}
    process.exit(1);
  }
}

resetDemoData();

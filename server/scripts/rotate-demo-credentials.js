/**
 * Rotates and deactivates legacy demo accounts.
 *
 * Usage (development):
 *   node scripts/rotate-demo-credentials.js
 *
 * Production requires an explicit confirmation flag:
 *   CONFIRM_DEMO_ROTATION=ROTATE node scripts/rotate-demo-credentials.js
 */
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { User } = require('../src/models');
const { sequelize } = require('../src/config/db');

const DEMO_EMAILS = [
  'student.demo@edusetu.in',
  'parent.demo@edusetu.in',
  'admin.demo@edusetu.in',
  'school.demo@edusetu.in',
  'student.test2026@gmail.com',
  'tawap55774@goldvester.com',
  'yoreto4215@hopefunder.com'
];

const run = async () => {
  if (process.env.NODE_ENV === 'production' && process.env.CONFIRM_DEMO_ROTATION !== 'ROTATE') {
    console.error('[Demo Rotation] Refusing to modify production data without CONFIRM_DEMO_ROTATION=ROTATE');
    process.exit(1);
  }

  await sequelize.authenticate();
  let changed = 0;
  let missing = 0;

  for (const email of DEMO_EMAILS) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      missing += 1;
      continue;
    }

    user.password = crypto.randomBytes(32).toString('hex');
    user.isActive = false;
    await user.save();
    changed += 1;
    console.log(`[Demo Rotation] Rotated password and deactivated: ${email}`);
  }

  console.log(`[Demo Rotation] Complete. Rotated: ${changed}. Not found: ${missing}.`);
  await sequelize.close();
};

run().catch(async (error) => {
  console.error('[Demo Rotation] Failed:', error.message);
  try {
    await sequelize.close();
  } catch {
    // ignore close errors
  }
  process.exit(1);
});

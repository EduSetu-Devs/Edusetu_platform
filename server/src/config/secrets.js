const fs = require('fs');

const SECRET_KEYS = [
  'JWT_SECRET',
  'OTP_HASH_SECRET',
  'ADMIN_VERIFICATION_PASSWORD',
  'DB_PASSWORD',
  'AI_API_KEY',
  'SMTP_PASS',
  'MYSQL_ROOT_PASSWORD',
  'METRICS_TOKEN'
];

const loadSecretsFromFiles = () => {
  for (const key of SECRET_KEYS) {
    if (process.env[key]) continue;
    const filePath = process.env[`${key}_FILE`];
    if (!filePath) continue;
    try {
      const value = fs.readFileSync(filePath, 'utf8').trim();
      if (value) process.env[key] = value;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[Secrets] Could not read ${key}_FILE (${filePath}): ${err.message}`);
    }
  }
};

module.exports = { loadSecretsFromFiles, SECRET_KEYS };
/**
 * Fail-fast production configuration check.
 * Run before building a release image or deploying:
 *   npm run check:prod
 */
process.env.NODE_ENV = 'production';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { validateEnvironment } = require('../src/config/validateEnv');
const { getAllowedOrigins } = require('../src/utils/originUtils');

validateEnvironment();

try {
  const origins = getAllowedOrigins();
  console.log('[Config] Production configuration passed validation.');
  console.log(`[Config] Allowed origins: ${origins.join(', ')}`);
} catch (error) {
  console.error('[Config] CORS validation failed:', error.message);
  process.exit(1);
}

const MIN_JWT_SECRET_LENGTH = 32;
const MIN_ADMIN_SECRET_LENGTH = 12;

const collectProductionErrors = () => {
  const errors = [];
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) return errors;

  const jwtSecret = process.env.JWT_SECRET || '';
  if (!jwtSecret) {
    errors.push('JWT_SECRET is required in production.');
  } else if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    errors.push(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters in production.`);
  } else if (/edusetu_dev|change[_-]?me|secret|password/i.test(jwtSecret)) {
    errors.push('JWT_SECRET appears to be a placeholder or development value.');
  }

  const adminSecret = process.env.ADMIN_VERIFICATION_PASSWORD || '';
  if (!adminSecret) {
    errors.push('ADMIN_VERIFICATION_PASSWORD is required in production.');
  } else if (adminSecret.length < MIN_ADMIN_SECRET_LENGTH) {
    errors.push(`ADMIN_VERIFICATION_PASSWORD must be at least ${MIN_ADMIN_SECRET_LENGTH} characters.`);
  }

  const otpHashSecret = process.env.OTP_HASH_SECRET || '';
  if (!otpHashSecret) {
    errors.push('OTP_HASH_SECRET is required in production.');
  } else if (otpHashSecret.length < MIN_JWT_SECRET_LENGTH) {
    errors.push(`OTP_HASH_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters in production.`);
  } else if (process.env.JWT_SECRET && otpHashSecret === process.env.JWT_SECRET) {
    errors.push('OTP_HASH_SECRET must be different from JWT_SECRET.');
  }

  if (!process.env.CLIENT_URL && !process.env.CORS_ORIGIN) {
    errors.push('CLIENT_URL (or CORS_ORIGIN) is required in production.');
  }

  if (process.env.AUTH_COOKIE_SAMESITE === 'none' && process.env.AUTH_COOKIE_SECURE !== 'true') {
    // The cookie helper forces Secure for SameSite=None, but make the deployment intent explicit.
    console.warn('[Config] SameSite=None cookies require HTTPS; Secure will be forced.');
  }

  if (process.env.ALLOW_UNVERIFIED_REGISTRATION === 'true') {
    errors.push('ALLOW_UNVERIFIED_REGISTRATION must not be enabled in production; email verification is mandatory.');
  }

  const smtpKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
  for (const key of smtpKeys) {
    if (!process.env[key]) errors.push(`${key} is required in production for OTP email delivery.`);
  }

  return errors;
};

const validateEnvironment = () => {
  const errors = collectProductionErrors();

  if (errors.length > 0) {
    console.error('====================================================');
    console.error('[Config] Refusing to start: insecure production configuration');
    for (const error of errors) console.error(`  - ${error}`);
    console.error('====================================================');
    process.exit(1);
  }
};

module.exports = { validateEnvironment };

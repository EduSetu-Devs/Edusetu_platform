const isProduction = process.env.NODE_ENV === 'production';

const splitOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const getAllowedOrigins = () => {
  const configured = [
    ...splitOrigins(process.env.CLIENT_URL),
    ...splitOrigins(process.env.CORS_ORIGIN)
  ];

  if (configured.length === 0) {
    if (isProduction) {
      throw new Error('CLIENT_URL or CORS_ORIGIN must be configured in production');
    }
    configured.push('http://localhost:5173');
  }

  if (!isProduction) {
    configured.push(
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    );
  }

  return [...new Set(configured)];
};

const createCorsOriginValidator = () => {
  const allowedOrigins = getAllowedOrigins();
  return (origin, callback) => {
    // Same-origin, server-to-server, and health probes do not send an Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  };
};

module.exports = {
  getAllowedOrigins,
  createCorsOriginValidator
};

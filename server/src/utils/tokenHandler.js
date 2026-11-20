const jwt = require('jsonwebtoken');

const DEFAULT_FALLBACK_SECRET = 'edusetu_demo_jwt_fallback_secret_key_2026_super_long';

/**
 * Generate a signed JWT token containing minimal necessary identity payload
 * @param {Object} user - User model instance
 * @returns {String} Signed JWT token
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || DEFAULT_FALLBACK_SECRET;

  const payload = {
    userId: user.id,
    role: user.role
  };

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify and decode a JWT token
 * @param {String} token - JWT string
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || DEFAULT_FALLBACK_SECRET;

  return jwt.verify(token, secret, { algorithms: ['HS256'] });
};

module.exports = {
  generateToken,
  verifyToken
};

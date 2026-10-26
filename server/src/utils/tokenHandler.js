const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token containing minimal necessary identity payload
 * @param {Object} user - User model instance
 * @returns {String} Signed JWT token
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

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
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken
};

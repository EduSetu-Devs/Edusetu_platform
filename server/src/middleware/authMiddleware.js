const { verifyToken } = require('../utils/tokenHandler');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Validates incoming Bearer JWT tokens and attaches authenticated user to req.user
 */
const authMiddleware = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists and starts with Bearer
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'Authentication required: No token provided',
        timestamp: new Date().toISOString()
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (tokenErr) {
      if (tokenErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired: Please log in again',
          timestamp: new Date().toISOString()
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: Invalid token',
        timestamp: new Date().toISOString()
      });
    }

    // Fetch user from DB to ensure user still exists and is active
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: User no longer exists',
        timestamp: new Date().toISOString()
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact an administrator',
        timestamp: new Date().toISOString()
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = authMiddleware;

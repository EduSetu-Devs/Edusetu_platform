const { verifyToken } = require('../utils/tokenHandler');
const { parseCookies, SESSION_COOKIE_NAME } = require('../utils/authCookie');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Accepts the HttpOnly session cookie (browser clients) or a Bearer JWT (API clients).
 * Validates the token and attaches the authenticated user to req.user.
 */
const authMiddleware = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else {
      const cookies = parseCookies(req);
      token = cookies[SESSION_COOKIE_NAME] || null;
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

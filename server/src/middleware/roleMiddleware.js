/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts access to routes based on user roles
 * @param  {...String} allowedRoles - e.g. 'admin', 'teacher', 'student', 'parent'
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions',
        timestamp: new Date().toISOString()
      });
    }

    // Check if the user's role is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: Role '${req.user.role}' is not authorized to access this resource`,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

const requireAdmin = authorizeRoles('admin');

module.exports = {
  authorizeRoles,
  requireAdmin
};

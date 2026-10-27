const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getCurrentUser,
  verifyAdminPassword,
  adminLogin,
  sendRegistrationOtp,
  verifyAndRegisterOtp
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Public authentication routes
router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendRegistrationOtp);
router.post('/verify-otp', verifyAndRegisterOtp);
router.post('/admin/verify', verifyAdminPassword);
router.post('/admin/login', adminLogin);
router.post('/verify-admin-password', verifyAdminPassword);

// Protected route: get authenticated user profile
router.get('/me', authMiddleware, getCurrentUser);

// Reusable test endpoints for verifying Role-Based Authorization
router.get('/test-role/admin', authMiddleware, authorizeRoles('admin'), (req, res) => {
  res.json({ success: true, message: 'Welcome Admin!', user: req.user.toJSON() });
});

router.get('/test-role/teacher', authMiddleware, authorizeRoles('teacher', 'admin'), (req, res) => {
  res.json({ success: true, message: 'Welcome Teacher or Admin!', user: req.user.toJSON() });
});

module.exports = router;

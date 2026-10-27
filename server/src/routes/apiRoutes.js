const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');
const testRoutes = require('./testRoutes');
const authRoutes = require('./authRoutes');
const studentRoutes = require('./studentRoutes');
const teacherRoutes = require('./teacherRoutes');
const parentRoutes = require('./parentRoutes');
const notificationRoutes = require('./notificationRoutes');
const adminRoutes = require('./adminRoutes');
const submissionAttachmentRoutes = require('./submissionAttachmentRoutes');
const tutorDiscoveryRoutes = require('./tutorDiscoveryRoutes');
const tutorProfileRoutes = require('./tutorProfileRoutes');
const tutorRequestRoutes = require('./tutorRequestRoutes');
const tutorBookingRoutes = require('./tutorBookingRoutes');
const schoolRoutes = require('./schoolRoutes');
const adminTutorRoutes = require('./adminTutorRoutes');
const courseRoutes = require('./courseRoutes');
const { getApiOverview } = require('../controllers/healthController');
const { downloadResource } = require('../controllers/teachingLearningController');
const authMiddleware = require('../middleware/authMiddleware');

// Root API overview: GET /api
router.get('/', getApiOverview);

// Health check route: GET /api/health
router.use('/health', healthRoutes);

// Authentication routes: /api/auth (register, login, me)
router.use('/auth', authRoutes);

// Student Module routes: /api/student (profile, dashboard, attendance, homework, marks)
router.use('/student', studentRoutes);

// Teacher Module routes: /api/teacher (profile, dashboard, students, attendance, homework, marks, conversations)
router.use('/teacher', teacherRoutes);

// Parent Module routes: /api/parent (profile, children, overview, conversations)
router.use('/parent', parentRoutes);

// Notification routes: /api/notifications (Step 7B)
router.use('/notifications', notificationRoutes);

// Admin Module routes: /api/admin (Step 8)
router.use('/admin/tutors', adminTutorRoutes);
router.use('/admin', adminRoutes);

// Phase 5: Tutor Discovery & Marketplace routes
router.use('/tutors', tutorDiscoveryRoutes);
router.use('/tutor', tutorProfileRoutes);
router.use('/tutor', tutorRequestRoutes);
router.use('/tutor', tutorBookingRoutes);
router.use('/school', schoolRoutes);

// Academic Courses & Batches Module
router.use('/courses', courseRoutes);

// Authorized homework submission attachment access
router.use('/submission-attachments', submissionAttachmentRoutes);
router.get('/teaching-resources/:resourceId', authMiddleware, downloadResource);

// Test routes: GET /api/test/db, GET /api/test/user-schema
router.use('/test', testRoutes);


module.exports = router;

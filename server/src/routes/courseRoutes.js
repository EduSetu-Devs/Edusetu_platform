const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  listCourses,
  getCourseDetails,
  enrollCourse,
  getStudentEnrolledCourses,
  getTeacherCourses,
  createTeacherCourse,
  getChildEnrolledCourses,
  getAdminCoursesOverview
} = require('../controllers/courseController');

// Optional auth for public list & detail (so logged in students can see their enrolled status)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authMiddleware(req, res, next);
  }
  next();
};

// 1. Course Discovery / Catalog (Public / Authenticated)
router.get('/', optionalAuth, listCourses);

// 2. Specific Named Routes (Must be before /:id)
// Authenticated Student's Enrolled Courses
router.get('/student/enrolled', authMiddleware, authorizeRoles('student'), getStudentEnrolledCourses);

// Authenticated Teacher's Created Courses & Enrolled Student Rosters
router.get('/teacher/my-courses', authMiddleware, authorizeRoles('teacher'), getTeacherCourses);
router.post('/teacher/create', authMiddleware, authorizeRoles('teacher'), createTeacherCourse);

// Authenticated Parent's Child Enrolled Courses
router.get('/parent/children/:studentId', authMiddleware, authorizeRoles('parent'), getChildEnrolledCourses);

// Admin Governance & Overview
router.get('/admin/overview', authMiddleware, authorizeRoles('admin'), getAdminCoursesOverview);

// 3. Parameterized Course Routes
router.get('/:id', optionalAuth, getCourseDetails);
router.post('/:id/enroll', authMiddleware, authorizeRoles('student', 'parent'), enrollCourse);

module.exports = router;

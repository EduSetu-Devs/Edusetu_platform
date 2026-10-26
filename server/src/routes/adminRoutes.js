const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const {
  listAdminBookings,
  listAdminBookingReports,
  updateAdminBookingReport
} = require('../controllers/tutorBookingController');
const {
  getAdminDashboard,
  getUsers,
  updateUserStatus,
  getTeachers,
  updateTeacherAssignment,
  getStudents,
  getAgeVerificationRequests,
  updateStudentAgeVerification,
  updateStudentAssignment,
  getParents,
  linkParentChild,
  unlinkParentChild,
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject
} = require('../controllers/adminController');

// All admin endpoints require authentication and admin role
router.use(authMiddleware);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', getAdminDashboard);
router.get('/marketplace/bookings', listAdminBookings);
router.get('/marketplace/reports', listAdminBookingReports);
router.patch('/marketplace/reports/:reportId', updateAdminBookingReport);

// User Management
router.get('/users', getUsers);
router.patch('/users/:userId/status', updateUserStatus);

// Teacher Management & Assignment
router.get('/teachers', getTeachers);
router.put('/teachers/:teacherId/assignment', updateTeacherAssignment);

// Student Management & Assignment
router.get('/students', getStudents);
router.get('/students/age-verification', getAgeVerificationRequests);
router.put('/students/:studentId/age-verification', updateStudentAgeVerification);
router.put('/students/:studentId/assignment', updateStudentAssignment);

// Parent Management & Child Linking
router.get('/parents', getParents);
router.post('/parents/:parentId/children', linkParentChild);
router.delete('/parents/:parentId/children/:studentId', unlinkParentChild);

// Class Management
router.get('/classes', getClasses);
router.post('/classes', createClass);
router.put('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass);

// Section Management
router.get('/sections', getSections);
router.post('/sections', createSection);
router.put('/sections/:id', updateSection);
router.delete('/sections/:id', deleteSection);

// Subject Management
router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

module.exports = router;

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { uploadSubmissionAttachments } = require('../middleware/submissionUpload');
const {
  getStudentProfile,
  updateStudentProfile,
  getStudentDashboard
} = require('../controllers/studentController');
const {
  getStudentAttendance,
  getAttendanceSummary
} = require('../controllers/attendanceController');
const {
  getStudentHomework,
  getHomeworkById,
  getStudentSubmission,
  submitHomework
} = require('../controllers/homeworkController');
const {
  getStudentMarks,
  getMarksById,
  getStudentPerformance
} = require('../controllers/marksController');
const {
  listStudentSessions,
  getStudentSessionDetails,
  joinSession
} = require('../controllers/teachingSessionController');
const {
  listResources,
  getSummary,
  getStudentHistory
} = require('../controllers/teachingLearningController');
const rateLimit = require('express-rate-limit');
const {
  studentPerformance,
  studentRecommendations,
  studyPlan,
  askDoubt,
  chatHistory,
  studentPractice,
  studentQuiz
} = require('../controllers/aiController');

const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'AI service is temporarily busy. Please try again.' } });

// All student routes require valid JWT authentication and 'student' role
router.use(authMiddleware);
router.use(authorizeRoles('student'));

// Profile Endpoints
router.get('/profile', getStudentProfile);
router.put('/profile', updateStudentProfile);

// Dashboard Summary Endpoint
router.get('/dashboard', getStudentDashboard);

// Teaching Sessions
router.get('/sessions', listStudentSessions);
router.get('/sessions/:sessionId', getStudentSessionDetails);
router.post('/sessions/:sessionId/join', joinSession);
router.get('/sessions/:sessionId/resources', listResources);
router.get('/sessions/:sessionId/summary', getSummary);
router.get('/learning-history', getStudentHistory);

// AI learning endpoints. All use the authenticated student's identity.
router.get('/ai/performance', aiLimiter, studentPerformance);
router.get('/ai/recommendations', aiLimiter, studentRecommendations);
router.post('/ai/study-plan', aiLimiter, studyPlan);
router.post('/ai/doubt', aiLimiter, askDoubt);
router.get('/ai/history', aiLimiter, chatHistory);
router.post('/ai/practice', aiLimiter, studentPractice);
router.post('/ai/quiz', aiLimiter, studentQuiz);

// Attendance Endpoints
router.get('/attendance', getStudentAttendance);
router.get('/attendance/summary', getAttendanceSummary);

// Homework & Assignment Endpoints
router.get('/homework', getStudentHomework);
router.get('/homework/:id', getHomeworkById);
router.get('/homework/:id/submission', getStudentSubmission);
router.post('/homework/:id/submit', uploadSubmissionAttachments, submitHomework);

// Marks & Academic Performance Endpoints
router.get('/marks', getStudentMarks);
router.get('/marks/:id', getMarksById);
router.get('/performance', getStudentPerformance);

module.exports = router;

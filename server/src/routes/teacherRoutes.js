const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getTeacherProfile,
  updateTeacherProfile,
  getTeacherDashboard
} = require('../controllers/teacherController');
const {
  getMyStudents,
  getStudentDetails,
  getStudentAttendanceSummary,
  getStudentMarksSummary,
  getStudentHomeworkSummary
} = require('../controllers/teacherStudentController');
const {
  getClassAttendance,
  markAttendance,
  bulkMarkAttendance,
  updateAttendance,
  getClassAttendanceSummary,
  getStudentAttendance
} = require('../controllers/teacherAttendanceController');
const {
  createHomework,
  getMyHomework,
  getHomeworkDetails,
  updateHomework,
  deleteHomework,
  getHomeworkSubmissions,
  getSubmissionDetails,
  gradeSubmission
} = require('../controllers/teacherHomeworkController');
const {
  getClassMarks,
  createMarks,
  bulkCreateMarks,
  updateMarks,
  getStudentMarks,
  getStudentResult,
  getClassResultSummary
} = require('../controllers/teacherMarksController');
const {
  getConversations,
  getMessageContacts,
  createConversation,
  getMessages,
  sendMessage,
  markMessageRead,
  getUnreadCount
} = require('../controllers/teacherMessageController');
const {
  createSession,
  listTeacherSessions,
  listSubjects,
  getTeacherSession,
  updateSession,
  cancelSession,
  startSession,
  completeSession
} = require('../controllers/teachingSessionController');
const {
  listResources,
  uploadResource,
  saveNote,
  saveFeedback,
  getSummary
} = require('../controllers/teachingLearningController');
const { uploadClassResource } = require('../middleware/classResourceUpload');
const rateLimit = require('express-rate-limit');
const { teacherStudentInsights, teacherClassInsights, teacherAssignmentAnalysis } = require('../controllers/aiController');
const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'AI service is temporarily busy. Please try again.' } });

// All teacher routes require valid JWT authentication and 'teacher' role
router.use(authMiddleware);
router.use(authorizeRoles('teacher'));

// Teacher Profile Endpoints
router.get('/profile', getTeacherProfile);
router.put('/profile', updateTeacherProfile);

// Teacher Dashboard Overview Endpoint
router.get('/dashboard', getTeacherDashboard);

// Teaching Session Management
router.post('/sessions', createSession);
router.get('/sessions', listTeacherSessions);
router.get('/subjects', listSubjects);
router.get('/sessions/:sessionId', getTeacherSession);
router.put('/sessions/:sessionId', updateSession);
router.patch('/sessions/:sessionId/cancel', cancelSession);
router.patch('/sessions/:sessionId/start', startSession);
router.patch('/sessions/:sessionId/complete', completeSession);
router.get('/sessions/:sessionId/resources', listResources);
router.post('/sessions/:sessionId/resources', uploadClassResource, uploadResource);
router.put('/sessions/:sessionId/notes', saveNote);
router.put('/sessions/:sessionId/feedback', saveFeedback);
router.get('/sessions/:sessionId/summary', getSummary);
router.get('/ai/students/:studentId', aiLimiter, teacherStudentInsights);
router.get('/ai/classes/:sessionId', aiLimiter, teacherClassInsights);
router.post('/ai/submissions/:submissionId', aiLimiter, teacherAssignmentAnalysis);

// Teacher Student Management Endpoints (Step 5B)
router.get('/students', getMyStudents);
router.get('/students/:studentId', getStudentDetails);
router.get('/students/:studentId/attendance', getStudentAttendanceSummary);
router.get('/students/:studentId/marks', getStudentMarksSummary);
router.get('/students/:studentId/homework', getStudentHomeworkSummary);

// Teacher Attendance Management Endpoints (Step 5C)
router.get('/attendance', getClassAttendance);
router.post('/attendance', markAttendance);
router.post('/attendance/bulk', bulkMarkAttendance);
router.put('/attendance/:id', updateAttendance);
router.get('/attendance/summary', getClassAttendanceSummary);
router.get('/attendance/student/:studentId', getStudentAttendance);

// Teacher Homework & Assignment Management Endpoints (Step 5D)
router.post('/homework', createHomework);
router.get('/homework', getMyHomework);
router.get('/homework/:id', getHomeworkDetails);
router.put('/homework/:id', updateHomework);
router.delete('/homework/:id', deleteHomework);
router.get('/homework/:id/submissions', getHomeworkSubmissions);
router.get('/homework/:homeworkId/submissions/:studentId', getSubmissionDetails);
router.patch('/homework/:homeworkId/submissions/:submissionId/grade', gradeSubmission);

// Aliases for /assignments
router.post('/assignments', createHomework);
router.get('/assignments', getMyHomework);
router.get('/assignments/:id', getHomeworkDetails);
router.put('/assignments/:id', updateHomework);
router.delete('/assignments/:id', deleteHomework);
router.get('/assignments/:id/submissions', getHomeworkSubmissions);
router.get('/assignments/:homeworkId/submissions/:studentId', getSubmissionDetails);
router.patch('/assignments/:homeworkId/submissions/:submissionId/grade', gradeSubmission);

// Teacher Marks & Result Management Endpoints (Step 5E)
router.get('/marks', getClassMarks);
router.post('/marks', createMarks);
router.post('/marks/bulk', bulkCreateMarks);
router.put('/marks/:id', updateMarks);
router.get('/marks/summary', getClassResultSummary);
router.get('/marks/student/:studentId', getStudentMarks);
router.get('/marks/student/:studentId/result', getStudentResult);

// Teacher ↔ Parent Messaging Endpoints (Step 7A)
router.get('/conversations', getConversations);
router.get('/message-contacts', getMessageContacts);
router.post('/conversations', createConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);
router.patch('/messages/:messageId/read', markMessageRead);
router.get('/messages/unread-count', getUnreadCount);

module.exports = router;

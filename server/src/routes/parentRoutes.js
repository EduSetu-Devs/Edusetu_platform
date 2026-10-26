const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getProfile,
  updateProfile,
  getChildren,
  getChildDetails,
  linkChild
} = require('../controllers/parentController');
const {
  getAcademicOverview,
  getAttendance,
  getAttendanceHistory,
  getHomework,
  getHomeworkHistory,
  getMarks,
  getResult
} = require('../controllers/parentAcademicController');
const {
  getConversations,
  getMessageContacts,
  createConversation,
  getMessages,
  sendMessage,
  markMessageRead,
  getUnreadCount
} = require('../controllers/parentMessageController');
const { getParentSessions } = require('../controllers/teachingLearningController');
const rateLimit = require('express-rate-limit');
const { parentInsights } = require('../controllers/aiController');
const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'AI service is temporarily busy. Please try again.' } });

// All parent routes require valid JWT authentication and 'parent' role
router.use(authMiddleware);
router.use(authorizeRoles('parent'));

// Parent Profile Endpoints
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Parent-Child Management Endpoints
router.get('/children', getChildren);
router.get('/children/:studentId', getChildDetails);
router.post('/children/link', linkChild);

// Parent Child Academic Dashboard Endpoints (Step 6B)
router.get('/children/:studentId/overview', getAcademicOverview);
router.get('/children/:studentId/attendance', getAttendance);
router.get('/children/:studentId/attendance/history', getAttendanceHistory);
router.get('/children/:studentId/homework', getHomework);
router.get('/children/:studentId/homework/history', getHomeworkHistory);
router.get('/children/:studentId/marks', getMarks);
router.get('/children/:studentId/result', getResult);
router.get('/children/:studentId/sessions', getParentSessions);
router.get('/children/:studentId/ai-insights', aiLimiter, parentInsights);

// Teacher ↔ Parent Messaging Endpoints (Step 7A)
router.get('/conversations', getConversations);
router.get('/message-contacts', getMessageContacts);
router.post('/conversations', createConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);
router.patch('/messages/:messageId/read', markMessageRead);
router.get('/messages/unread-count', getUnreadCount);

module.exports = router;

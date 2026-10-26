const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getNotifications,
  getNotificationUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteSingleNotification
} = require('../controllers/notificationController');

// All notification routes require a valid authenticated JWT
router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/unread-count', getNotificationUnreadCount);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:notificationId/read', markNotificationRead);
router.delete('/:notificationId', deleteSingleNotification);

module.exports = router;

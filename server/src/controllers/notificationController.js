const {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../services/notificationService');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Get Paginated Notifications for Authenticated User
 * @route GET /api/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unread, type } = req.query;

    const data = await getUserNotifications(userId, {
      page,
      limit,
      unread,
      type
    });

    return successResponse(res, 200, 'Notifications retrieved successfully', data);
  } catch (error) {
    console.error('[Get Notifications Controller Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve notifications');
  }
};

/**
 * Get Total Unread Notification Count for Authenticated User
 * @route GET /api/notifications/unread-count
 */
const getNotificationUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await getUnreadCount(userId);

    return successResponse(res, 200, 'Unread notification count retrieved', {
      unreadCount: count
    });
  } catch (error) {
    console.error('[Get Notification Unread Count Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve unread notification count');
  }
};

/**
 * Mark a Single Notification as Read
 * @route PATCH /api/notifications/:notificationId/read
 */
const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const result = await markAsRead(notificationId, userId);

    if (result.notFound) {
      return errorResponse(res, 404, 'Notification not found');
    }
    if (!result.authorized) {
      return errorResponse(res, 403, 'Access denied. You are not authorized to update this notification.');
    }

    return successResponse(res, 200, 'Notification marked as read', {
      id: result.notification.id,
      isRead: result.notification.isRead,
      readAt: result.notification.readAt
    });
  } catch (error) {
    console.error('[Mark Notification Read Error]:', error.message);
    return errorResponse(res, 500, 'Failed to update notification status');
  }
};

/**
 * Mark All Unread Notifications as Read
 * @route PATCH /api/notifications/read-all
 */
const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const updatedCount = await markAllAsRead(userId);

    return successResponse(res, 200, 'All notifications marked as read', {
      updatedCount
    });
  } catch (error) {
    console.error('[Mark All Notifications Read Error]:', error.message);
    return errorResponse(res, 500, 'Failed to update notifications');
  }
};

/**
 * Delete a Single Notification
 * @route DELETE /api/notifications/:notificationId
 */
const deleteSingleNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const result = await deleteNotification(notificationId, userId);

    if (result.notFound) {
      return errorResponse(res, 404, 'Notification not found');
    }
    if (!result.authorized) {
      return errorResponse(res, 403, 'Access denied. You are not authorized to delete this notification.');
    }

    return successResponse(res, 200, 'Notification deleted successfully');
  } catch (error) {
    console.error('[Delete Notification Error]:', error.message);
    return errorResponse(res, 500, 'Failed to delete notification');
  }
};

module.exports = {
  getNotifications,
  getNotificationUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteSingleNotification
};

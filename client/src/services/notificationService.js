import apiClient from './api';

/**
 * Fetch paginated notifications for authenticated user
 * @param {Object} params - { page, limit, unread, type }
 * @returns {Promise<Object>} { success, data, error }
 */
export const getNotifications = async (params = {}) => {
  try {
    const response = await apiClient.get('/notifications', { params });
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch notifications';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Get total unread notification count
 * @returns {Promise<Object>} { success, data, error }
 */
export const getNotificationUnreadCount = async () => {
  try {
    const response = await apiClient.get('/notifications/unread-count');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch unread count';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Mark a single notification as read
 * @param {string|number} notificationId
 * @returns {Promise<Object>} { success, data, error }
 */
export const markNotificationRead = async (notificationId) => {
  try {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to mark notification as read';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Mark all unread notifications of user as read
 * @returns {Promise<Object>} { success, data, error }
 */
export const markAllNotificationsRead = async () => {
  try {
    const response = await apiClient.patch('/notifications/read-all');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to mark all as read';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Delete a notification
 * @param {string|number} notificationId
 * @returns {Promise<Object>} { success, data, error }
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to delete notification';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

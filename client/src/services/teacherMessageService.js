import apiClient from './api';

/**
 * Fetch all conversations for authenticated teacher
 * @returns {Promise<Object>} { success, data, error }
 */
export const getTeacherConversations = async () => {
  try {
    const response = await apiClient.get('/teacher/conversations');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch conversations';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

export const getTeacherMessageContacts = async () => {
  try {
    const response = await apiClient.get('/teacher/message-contacts');
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data?.message || error.message || 'Failed to fetch messaging contacts'
    };
  }
};

/**
 * Create or retrieve conversation with a parent regarding a student
 * @param {Object} payload - { parentId, studentId }
 * @returns {Promise<Object>} { success, data, error }
 */
export const createTeacherConversation = async (payload) => {
  try {
    const response = await apiClient.post('/teacher/conversations', payload);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to create conversation';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch chronological messages for a conversation
 * @param {string|number} conversationId
 * @returns {Promise<Object>} { success, data, error }
 */
export const getTeacherMessages = async (conversationId) => {
  try {
    const response = await apiClient.get(`/teacher/conversations/${conversationId}/messages`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch messages';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Send a message as teacher
 * @param {string|number} conversationId
 * @param {string} message
 * @returns {Promise<Object>} { success, data, error }
 */
export const sendTeacherMessage = async (conversationId, message) => {
  try {
    const response = await apiClient.post(`/teacher/conversations/${conversationId}/messages`, { message });
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const messageText = error.response?.data?.message || error.message || 'Failed to send message';
    return {
      success: false,
      status: error.response?.status,
      error: messageText
    };
  }
};

/**
 * Mark a message as read
 * @param {string|number} messageId
 * @returns {Promise<Object>} { success, data, error }
 */
export const markTeacherMessageRead = async (messageId) => {
  try {
    const response = await apiClient.patch(`/teacher/messages/${messageId}/read`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const messageText = error.response?.data?.message || error.message || 'Failed to mark message as read';
    return {
      success: false,
      status: error.response?.status,
      error: messageText
    };
  }
};

/**
 * Get total unread message count for teacher
 * @returns {Promise<Object>} { success, data, error }
 */
export const getTeacherUnreadCount = async () => {
  try {
    const response = await apiClient.get('/teacher/messages/unread-count');
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

import apiClient from './api';

/**
 * Fetch all conversations for authenticated parent
 * @returns {Promise<Object>} { success, data, error }
 */
export const getParentConversations = async () => {
  try {
    const response = await apiClient.get('/parent/conversations');
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

export const getParentMessageContacts = async () => {
  try {
    const response = await apiClient.get('/parent/message-contacts');
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
 * Create or retrieve conversation with a teacher regarding a linked student
 * @param {Object} payload - { teacherId, studentId }
 * @returns {Promise<Object>} { success, data, error }
 */
export const createParentConversation = async (payload) => {
  try {
    const response = await apiClient.post('/parent/conversations', payload);
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
export const getParentMessages = async (conversationId) => {
  try {
    const response = await apiClient.get(`/parent/conversations/${conversationId}/messages`);
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
 * Send a message as parent
 * @param {string|number} conversationId
 * @param {string} message
 * @returns {Promise<Object>} { success, data, error }
 */
export const sendParentMessage = async (conversationId, message) => {
  try {
    const response = await apiClient.post(`/parent/conversations/${conversationId}/messages`, { message });
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
export const markParentMessageRead = async (messageId) => {
  try {
    const response = await apiClient.patch(`/parent/messages/${messageId}/read`);
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
 * Get total unread message count for parent
 * @returns {Promise<Object>} { success, data, error }
 */
export const getParentUnreadCount = async () => {
  try {
    const response = await apiClient.get('/parent/messages/unread-count');
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

import apiClient from './api';

export const getChildSessions = async (studentId) => {
  try { const response = await apiClient.get(`/parent/children/${studentId}/sessions`); return { success: true, data: response.data.data }; }
  catch (error) { return { success: false, error: error.response?.data?.message || error.message || 'Failed to fetch child classes' }; }
};

export const getChildAIInsights = async (studentId) => {
  try { const response = await apiClient.get(`/parent/children/${studentId}/ai-insights`); return { success: true, data: response.data.data }; }
  catch (error) { return { success: false, error: error.response?.data?.message || error.message || 'Failed to generate child insights' }; }
};

/**
 * Fetch authenticated parent profile
 * @returns {Promise<Object>} { success, data, error }
 */
export const getParentProfile = async () => {
  try {
    const response = await apiClient.get('/parent/profile');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch parent profile';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Update authenticated parent profile
 * @param {Object} profileData
 * @returns {Promise<Object>} { success, data, error }
 */
export const updateParentProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/parent/profile', profileData);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to update parent profile';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch all children linked to authenticated parent
 * @returns {Promise<Object>} { success, data, error }
 */
export const getMyChildren = async () => {
  try {
    const response = await apiClient.get('/parent/children');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch linked children';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch specific child profile details (verifies parent ownership)
 * @param {string|number} studentId
 * @returns {Promise<Object>} { success, data, error }
 */
export const getChildDetails = async (studentId) => {
  try {
    const response = await apiClient.get(`/parent/children/${studentId}`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch child details';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Link an enrolled student to authenticated parent
 * @param {Object} data - { studentId, relationship }
 * @returns {Promise<Object>} { success, data, error }
 */
export const linkChild = async (data) => {
  try {
    const response = await apiClient.post('/parent/children/link', data);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to link child';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch complete academic overview for a child
 * @param {string|number} studentId
 * @returns {Promise<Object>} { success, data, error }
 */
export const getAcademicOverview = async (studentId) => {
  try {
    const response = await apiClient.get(`/parent/children/${studentId}/overview`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch child academic overview';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch attendance summary for a child
 * @param {string|number} studentId
 * @returns {Promise<Object>} { success, data, error }
 */
export const getChildAttendance = async (studentId) => {
  try {
    const response = await apiClient.get(`/parent/children/${studentId}/attendance`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch child attendance summary';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch detailed attendance history for a child
 * @param {string|number} studentId
 * @returns {Promise<Object>} { success, data, error }
 */
export const getChildAttendanceHistory = async (studentId) => {
  try {
    const response = await apiClient.get(`/parent/children/${studentId}/attendance/history`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch child attendance history';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch homework summary for a child
 * @param {string|number} studentId
 * @returns {Promise<Object>} { success, data, error }
 */
export const getChildHomework = async (studentId) => {
  try {
    const response = await apiClient.get(`/parent/children/${studentId}/homework`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch child homework';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch full homework history for a child
 * @param {string|number} studentId
 * @returns {Promise<Object>} { success, data, error }
 */
export const getChildHomeworkHistory = async (studentId) => {
  try {
    const response = await apiClient.get(`/parent/children/${studentId}/homework/history`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch child homework history';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch marks and subject-wise grades for a child
 * @param {string|number} studentId
 * @returns {Promise<Object>} { success, data, error }
 */
export const getChildMarks = async (studentId) => {
  try {
    const response = await apiClient.get(`/parent/children/${studentId}/marks`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch child marks';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch cumulative result and GPA analytics for a child
 * @param {string|number} studentId
 * @returns {Promise<Object>} { success, data, error }
 */
export const getChildResult = async (studentId) => {
  try {
    const response = await apiClient.get(`/parent/children/${studentId}/result`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch child result';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

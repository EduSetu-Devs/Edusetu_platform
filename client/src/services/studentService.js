import apiClient from './api';

export const getStudentSessions = async (params = {}) => {
  try {
    const response = await apiClient.get('/student/sessions', { params });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, status: error.response?.status, error: error.response?.data?.message || error.message || 'Failed to fetch classes' };
  }
};

export const joinStudentSession = async (id) => {
  try {
    const response = await apiClient.post(`/student/sessions/${id}/join`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, status: error.response?.status, error: error.response?.data?.message || error.message || 'Failed to join class' };
  }
};

export const getStudentClassResources = async (sessionId) => {
  try { const response = await apiClient.get(`/student/sessions/${sessionId}/resources`); return { success: true, data: response.data.data }; }
  catch (error) { return { success: false, error: error.response?.data?.message || error.message || 'Failed to fetch resources' }; }
};

export const getStudentClassSummary = async (sessionId) => {
  try { const response = await apiClient.get(`/student/sessions/${sessionId}/summary`); return { success: true, data: response.data.data }; }
  catch (error) { return { success: false, error: error.response?.data?.message || error.message || 'Failed to fetch class summary' }; }
};

export const getStudentLearningHistory = async () => {
  try { const response = await apiClient.get('/student/learning-history'); return { success: true, data: response.data.data }; }
  catch (error) { return { success: false, error: error.response?.data?.message || error.message || 'Failed to fetch learning history' }; }
};

const aiRequest = async (method, url, data, config = {}) => {
  try { const response = await apiClient({ method, url, data, ...config }); return { success: true, data: response.data.data }; }
  catch (error) { return { success: false, error: error.response?.data?.message || error.message || 'AI request failed' }; }
};
export const getStudentAIPerformance = (params) => aiRequest('get', '/student/ai/performance', null, { params });
export const getStudentAIRecommendations = (params) => aiRequest('get', '/student/ai/recommendations', null, { params });
export const createStudentStudyPlan = (data) => aiRequest('post', '/student/ai/study-plan', data);
export const askStudentAI = (payload) => {
  const data = typeof payload === 'string' ? { question: payload } : payload;
  return aiRequest('post', '/student/ai/doubt', data);
};
export const getStudentAIHistory = (conversationId) => {
  const url = conversationId ? `/student/ai/history?conversationId=${encodeURIComponent(conversationId)}` : '/student/ai/history';
  return aiRequest('get', url);
};
export const generateStudentPractice = (data) => aiRequest('post', '/student/ai/practice', data);
export const generateStudentQuiz = (data) => aiRequest('post', '/student/ai/quiz', data);

export const getStudentSession = async (id) => {
  try {
    const response = await apiClient.get(`/student/sessions/${id}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, status: error.response?.status, error: error.response?.data?.message || error.message || 'Failed to fetch class' };
  }
};

const normalizeSubmission = (submission) => {
  if (!submission) return submission;
  return {
    ...submission,
    attachments: Array.isArray(submission.attachments) ? submission.attachments : []
  };
};

const normalizeHomeworkDetails = (data) => ({
  ...data,
  submission: normalizeSubmission(data?.submission)
});

/**
 * Fetch authenticated student profile
 * @returns {Promise<Object>} { success, data, error }
 */
export const getStudentProfile = async () => {
  try {
    const response = await apiClient.get('/student/profile');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch student profile';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Update authenticated student profile
 * @param {Object} profileData - { name, phone, className, section, rollNumber, dateOfBirth, gender, address }
 * @returns {Promise<Object>} { success, data, error }
 */
export const updateStudentProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/student/profile', profileData);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to update profile';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch student dashboard summary
 * @returns {Promise<Object>} { success, data, error }
 */
export const getStudentDashboard = async () => {
  try {
    const response = await apiClient.get('/student/dashboard');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch student dashboard';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch student attendance records with optional filters
 * @param {Object} filters - { subject, startDate, endDate }
 * @returns {Promise<Object>} { success, data, error }
 */
export const getStudentAttendance = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.subject && filters.subject.trim()) {
      params.append('subject', filters.subject.trim());
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/student/attendance${queryString}`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch attendance records';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch student attendance summary statistics
 * @param {Object} filters - { subject, startDate, endDate }
 * @returns {Promise<Object>} { success, data, error }
 */
export const getStudentAttendanceSummary = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.subject && filters.subject.trim()) {
      params.append('subject', filters.subject.trim());
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/student/attendance/summary${queryString}`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch attendance summary';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch student homework list with optional filters
 * @param {Object} filters - { subject, status, search, startDate, endDate }
 * @returns {Promise<Object>} { success, data, error }
 */
export const getStudentHomework = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.subject && filters.subject.trim()) {
      params.append('subject', filters.subject.trim());
    }
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters.search && filters.search.trim()) {
      params.append('search', filters.search.trim());
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/student/homework${queryString}`);
    return {
      success: true,
      data: Array.isArray(response.data.data) ? response.data.data : []
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch homework list';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch homework details by ID
 * @param {number|string} id - Homework ID
 * @returns {Promise<Object>} { success, data, error }
 */
export const getHomeworkById = async (id) => {
  try {
    const response = await apiClient.get(`/student/homework/${id}`);
    return {
      success: true,
      data: normalizeHomeworkDetails(response.data.data)
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch homework details';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch student submission for a homework
 * @param {number|string} id - Homework ID
 * @returns {Promise<Object>} { success, data, error }
 */
export const getStudentSubmission = async (id) => {
  try {
    const response = await apiClient.get(`/student/homework/${id}/submission`);
    return {
      success: true,
      data: {
        ...response.data.data,
        submission: normalizeSubmission(response.data.data?.submission)
      }
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch submission';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Submit homework assignment
 * @param {number|string} id - Homework ID
 * @param {Object} submissionData - { submissionText, attachmentUrl, files }
 * @returns {Promise<Object>} { success, data, error }
 */
export const submitHomework = async (id, submissionData) => {
  try {
    const formData = new FormData();
    if (submissionData.submissionText) formData.append('submissionText', submissionData.submissionText);
    if (submissionData.attachmentUrl) formData.append('attachmentUrl', submissionData.attachmentUrl);
    (submissionData.files || []).forEach((file) => formData.append('attachments', file));

    const response = await apiClient.post(`/student/homework/${id}/submit`, formData);
    const responseData = response.data.data || {};
    return {
      success: true,
      data: {
        ...responseData,
        attachments: Array.isArray(responseData.attachments) ? responseData.attachments : []
      }
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to submit homework';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch student marks with optional filters
 * @param {Object} filters - { subject, examType, examName, search, startDate, endDate }
 * @returns {Promise<Object>} { success, data, error }
 */
export const getStudentMarks = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.subject && filters.subject.trim()) {
      params.append('subject', filters.subject.trim());
    }
    if (filters.examType && filters.examType !== 'all') {
      params.append('examType', filters.examType);
    }
    if (filters.examName && filters.examName.trim()) {
      params.append('examName', filters.examName.trim());
    }
    if (filters.search && filters.search.trim()) {
      params.append('search', filters.search.trim());
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/student/marks${queryString}`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch marks';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch specific mark details by ID
 * @param {number|string} id - Mark ID
 * @returns {Promise<Object>} { success, data, error }
 */
export const getMarkById = async (id) => {
  try {
    const response = await apiClient.get(`/student/marks/${id}`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch mark details';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch overall student academic performance and subject-wise analytics
 * @returns {Promise<Object>} { success, data, error }
 */
export const getStudentPerformance = async () => {
  try {
    const response = await apiClient.get('/student/performance');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch academic performance';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

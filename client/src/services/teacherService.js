import apiClient from './api';
import { getStoredToken } from './authService';

/**
 * Fetch authenticated teacher profile
 * @returns {Promise<Object>} { success, data, error }
 */
export const getTeacherProfile = async () => {
  try {
    const response = await apiClient.get('/teacher/profile');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch teacher profile';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

export const getTeacherSessions = async (params = {}) => {
  try {
    const response = await apiClient.get('/teacher/sessions', { params });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, status: error.response?.status, error: error.response?.data?.message || error.message || 'Failed to fetch classes' };
  }
};

export const getTeachingSubjects = async () => {
  try {
    const response = await apiClient.get('/teacher/subjects');
    return { success: true, data: response.data.data || [] };
  } catch (error) {
    return { success: false, status: error.response?.status, error: error.response?.data?.message || error.message || 'Failed to fetch subjects' };
  }
};

export const createTeacherSession = async (sessionData) => {
  try {
    const response = await apiClient.post('/teacher/sessions', sessionData);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, status: error.response?.status, error: error.response?.data?.message || error.message || 'Failed to schedule class' };
  }
};

export const startTeacherSession = async (id) => {
  try {
    const response = await apiClient.patch(`/teacher/sessions/${id}/start`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, status: error.response?.status, error: error.response?.data?.message || error.message || 'Failed to start class' };
  }
};

export const getTeacherSession = async (id) => {
  try {
    const response = await apiClient.get(`/teacher/sessions/${id}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, status: error.response?.status, error: error.response?.data?.message || error.message || 'Failed to fetch class' };
  }
};

export const cancelTeacherSession = async (id) => {
  try {
    const response = await apiClient.patch(`/teacher/sessions/${id}/cancel`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, status: error.response?.status, error: error.response?.data?.message || error.message || 'Failed to cancel class' };
  }
};

export const completeTeacherSession = async (id) => {
  try {
    const response = await apiClient.patch(`/teacher/sessions/${id}/complete`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, status: error.response?.status, error: error.response?.data?.message || error.message || 'Failed to complete class' };
  }
};

export const getClassResources = async (sessionId) => {
  try { const response = await apiClient.get(`/teacher/sessions/${sessionId}/resources`); return { success: true, data: response.data.data }; }
  catch (error) { return { success: false, error: error.response?.data?.message || error.message || 'Failed to fetch resources' }; }
};

export const uploadClassResource = async (sessionId, file) => {
  try { const formData = new FormData(); formData.append('resource', file); const response = await apiClient.post(`/teacher/sessions/${sessionId}/resources`, formData); return { success: true, data: response.data.data }; }
  catch (error) { return { success: false, error: error.response?.data?.message || error.message || 'Failed to upload resource' }; }
};

export const saveClassNote = async (sessionId, content) => {
  try { const response = await apiClient.put(`/teacher/sessions/${sessionId}/notes`, { content }); return { success: true, data: response.data.data }; }
  catch (error) { return { success: false, error: error.response?.data?.message || error.message || 'Failed to save notes' }; }
};

export const saveClassFeedback = async (sessionId, data) => {
  try { const response = await apiClient.put(`/teacher/sessions/${sessionId}/feedback`, data); return { success: true, data: response.data.data }; }
  catch (error) { return { success: false, error: error.response?.data?.message || error.message || 'Failed to save feedback' }; }
};

export const getClassSummary = async (sessionId) => {
  try { const response = await apiClient.get(`/teacher/sessions/${sessionId}/summary`); return { success: true, data: response.data.data }; }
  catch (error) { return { success: false, error: error.response?.data?.message || error.message || 'Failed to fetch class summary' }; }
};

export const getTeacherStudentAIInsights = async (studentId) => {
  try { const response = await apiClient.get(`/teacher/ai/students/${studentId}`); return { success: true, data: response.data.data }; }
  catch (error) { return { success: false, error: error.response?.data?.message || error.message || 'Failed to generate insights' }; }
};
export const getTeacherClassAIInsights = async (sessionId) => {
  try { const response = await apiClient.get(`/teacher/ai/classes/${sessionId}`); return { success: true, data: response.data.data }; }
  catch (error) { return { success: false, error: error.response?.data?.message || error.message || 'Failed to generate class insights' }; }
};

/**
 * Update authenticated teacher profile
 * @param {Object} profileData
 * @returns {Promise<Object>} { success, data, error }
 */
export const updateTeacherProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/teacher/profile', profileData);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to update teacher profile';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Fetch teacher dashboard overview
 * @returns {Promise<Object>} { success, data, error }
 */
export const getTeacherDashboard = async () => {
  try {
    const response = await apiClient.get('/teacher/dashboard');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch teacher dashboard';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Get assigned students for the authenticated teacher
 * @param {Object} params - { search }
 * @returns {Promise<Object>} { success, data, error }
 */
export const getMyStudents = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.search && params.search.trim()) {
      queryParams.append('search', params.search.trim());
    }

    const queryString = queryParams.toString();
    const url = `/teacher/students${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get(url);

    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch assigned students';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Get specific student details by ID
 * @param {string|number} studentId
 * @returns {Promise<Object>} { success, data, error }
 */
export const getStudentDetails = async (studentId) => {
  try {
    const response = await apiClient.get(`/teacher/students/${studentId}`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch student details';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Get student attendance summary
 * @param {string|number} studentId
 * @returns {Promise<Object>} { success, data, error }
 */
export const getStudentAttendanceSummary = async (studentId) => {
  try {
    const response = await apiClient.get(`/teacher/students/${studentId}/attendance`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch student attendance summary';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Get student marks and academic performance summary
 * @param {string|number} studentId
 * @returns {Promise<Object>} { success, data, error }
 */
export const getStudentMarksSummary = async (studentId) => {
  try {
    const response = await apiClient.get(`/teacher/students/${studentId}/marks`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch student marks summary';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Get student homework and submission summary
 * @param {string|number} studentId
 * @returns {Promise<Object>} { success, data, error }
 */
export const getStudentHomeworkSummary = async (studentId) => {
  try {
    const response = await apiClient.get(`/teacher/students/${studentId}/homework`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch student homework summary';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Get class attendance roster for a specific date and subject
 * @param {Object} filters - { date, subject }
 * @returns {Promise<Object>} { success, data, error }
 */
export const getClassAttendance = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.date) queryParams.append('date', filters.date);
    if (filters.subject) queryParams.append('subject', filters.subject);

    const queryString = queryParams.toString();
    const url = `/teacher/attendance${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get(url);

    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch class attendance';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Mark attendance for a single student
 * @param {Object} data - { studentId, date, subject, status, remarks }
 * @returns {Promise<Object>} { success, data, error }
 */
export const markAttendance = async (data) => {
  try {
    const response = await apiClient.post('/teacher/attendance', data);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to mark attendance';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Bulk mark attendance for a class
 * @param {Object} data - { date, subject, records: [ { studentId, status, remarks } ] }
 * @returns {Promise<Object>} { success, data, error }
 */
export const bulkMarkAttendance = async (data) => {
  try {
    const response = await apiClient.post('/teacher/attendance/bulk', data);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to save bulk attendance';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Update an existing attendance record
 * @param {number|string} id - Attendance record ID
 * @param {Object} data - { status, remarks }
 * @returns {Promise<Object>} { success, data, error }
 */
export const updateAttendance = async (id, data) => {
  try {
    const response = await apiClient.put(`/teacher/attendance/${id}`, data);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to update attendance';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Get class attendance summary for a date and subject
 * @param {Object} filters - { date, subject }
 * @returns {Promise<Object>} { success, data, error }
 */
export const getClassAttendanceSummary = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.date) queryParams.append('date', filters.date);
    if (filters.subject) queryParams.append('subject', filters.subject);

    const queryString = queryParams.toString();
    const url = `/teacher/attendance/summary${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get(url);

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
 * Get individual student attendance summary
 * @param {number|string} studentId
 * @returns {Promise<Object>} { success, data, error }
 */
export const getStudentAttendance = async (studentId) => {
  try {
    const response = await apiClient.get(`/teacher/attendance/student/${studentId}`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch student attendance';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Create a new homework assignment
 * @param {Object} data - { title, description, subject, dueDate, assignedDate, status, attachmentUrl }
 * @returns {Promise<Object>} { success, data, error }
 */
export const createHomework = async (data) => {
  try {
    const response = await apiClient.post('/teacher/homework', data);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to create homework assignment';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Get teacher's created homework assignments with search and filters
 * @param {Object} filters - { search, subject, status, startDate, endDate }
 * @returns {Promise<Object>} { success, data, error }
 */
export const getMyHomework = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.subject) queryParams.append('subject', filters.subject);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);

    const queryString = queryParams.toString();
    const url = `/teacher/homework${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get(url);

    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch homework assignments';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Get specific homework assignment details
 * @param {number|string} id
 * @returns {Promise<Object>} { success, data, error }
 */
export const getHomeworkDetails = async (id) => {
  try {
    const response = await apiClient.get(`/teacher/homework/${id}`);
    return {
      success: true,
      data: response.data.data
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
 * Update homework assignment
 * @param {number|string} id
 * @param {Object} data - { title, description, subject, dueDate, status, attachmentUrl }
 * @returns {Promise<Object>} { success, data, error }
 */
export const updateHomework = async (id, data) => {
  try {
    const response = await apiClient.put(`/teacher/homework/${id}`, data);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to update homework assignment';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Delete / cancel homework assignment
 * @param {number|string} id
 * @returns {Promise<Object>} { success, data, error }
 */
export const deleteHomework = async (id) => {
  try {
    const response = await apiClient.delete(`/teacher/homework/${id}`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to delete homework assignment';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Get direct view URL with auth token for attachments
 * @param {number|string} attachmentId
 */
export const getAttachmentViewUrl = (attachmentId) => {
  const token = getStoredToken();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  return `${baseUrl}/submission-attachments/${attachmentId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
};

/**
 * Get direct download URL with auth token for attachments
 * @param {number|string} attachmentId
 */
export const getAttachmentDownloadUrl = (attachmentId) => {
  const token = getStoredToken();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  return `${baseUrl}/submission-attachments/${attachmentId}?download=1${token ? `&token=${encodeURIComponent(token)}` : ''}`;
};

const normalizeAttachment = (attachment) => ({
  ...attachment,
  viewUrl: getAttachmentViewUrl(attachment.id),
  downloadUrl: getAttachmentDownloadUrl(attachment.id)
});

/**
 * Trigger authenticated browser download for an attachment file
 * @param {number|string} attachmentId
 * @param {string} filename
 */
export const downloadAttachmentFile = async (attachmentId, filename) => {
  try {
    const response = await apiClient.get(`/submission-attachments/${attachmentId}?download=1`, {
      responseType: 'blob'
    });
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename || 'attachment');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    return { success: true };
  } catch (error) {
    console.error('Download attachment error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to download attachment'
    };
  }
};

/**
 * Get all student submissions for a specific homework
 * @param {number|string} id
 * @returns {Promise<Object>} { success, data, error }
 */
export const getHomeworkSubmissions = async (id) => {
  try {
    const response = await apiClient.get(`/teacher/homework/${id}/submissions`);
    const data = response.data.data || {};
    return {
      success: true,
      data: {
        ...data,
        homework: data.homework || data.assignment || {},
        assignment: data.assignment || data.homework || {},
        stats: data.stats || { totalStudents: 0, submitted: 0, late: 0, pending: 0 },
        students: Array.isArray(data.students)
          ? data.students.map((student) => ({
              ...student,
              attachments: Array.isArray(student.attachments)
                ? student.attachments.map(normalizeAttachment)
                : []
            }))
          : [],
        submissions: Array.isArray(data.submissions)
          ? data.submissions.map((submission) => ({
              ...submission,
              attachments: Array.isArray(submission.attachments)
                ? submission.attachments.map(normalizeAttachment)
                : []
            }))
          : []
      }
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch homework submissions';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Get specific student submission details
 * @param {number|string} homeworkId
 * @param {number|string} studentId
 * @returns {Promise<Object>} { success, data, error }
 */
export const getSubmissionDetails = async (homeworkId, studentId) => {
  try {
    const response = await apiClient.get(`/teacher/homework/${homeworkId}/submissions/${studentId}`);
    const data = response.data.data || {};
    const submission = data.submission || {};
    return {
      success: true,
      data: {
        ...data,
        homework: data.homework || data.assignment || {},
        assignment: data.assignment || data.homework || {},
        submission: {
          ...submission,
          attachments: Array.isArray(submission.attachments)
            ? submission.attachments.map(normalizeAttachment)
            : []
        }
      }
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch submission details';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Save or update a grade for a teacher-owned homework submission.
 * @param {number|string} homeworkId
 * @param {number|string} submissionId
 * @param {{marks: number|string, feedback?: string}} gradingData
 */
export const gradeSubmission = async (homeworkId, submissionId, gradingData) => {
  try {
    const response = await apiClient.patch(
      `/teacher/homework/${homeworkId}/submissions/${submissionId}/grade`,
      gradingData
    );
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to save submission grade';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Get class marks roster for a given subject & exam
 * @param {Object} filters - { subject, examType, examName }
 * @returns {Promise<Object>} { success, data, error }
 */
export const getClassMarks = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.subject) queryParams.append('subject', filters.subject);
    if (filters.examType) queryParams.append('examType', filters.examType);
    if (filters.examName) queryParams.append('examName', filters.examName);

    const queryString = queryParams.toString();
    const url = `/teacher/marks${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get(url);

    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch class marks';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Create or update single student mark
 * @param {Object} data - { studentId, subject, examType, examName, maxMarks, obtainedMarks, examDate, remarks }
 * @returns {Promise<Object>} { success, data, error }
 */
export const createMarks = async (data) => {
  try {
    const response = await apiClient.post('/teacher/marks', data);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to save marks';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Bulk create or update marks for class roster
 * @param {Object} data - { subject, examType, examName, maxMarks, examDate, records: [ { studentProfileId, obtainedMarks, remarks } ] }
 * @returns {Promise<Object>} { success, data, error }
 */
export const bulkCreateMarks = async (data) => {
  try {
    const response = await apiClient.post('/teacher/marks/bulk', data);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to save bulk marks';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Update existing marks record
 * @param {number|string} id
 * @param {Object} data - { obtainedMarks, maxMarks, remarks, examDate }
 * @returns {Promise<Object>} { success, data, error }
 */
export const updateMarks = async (id, data) => {
  try {
    const response = await apiClient.put(`/teacher/marks/${id}`, data);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to update marks';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Get student marks history
 * @param {number|string} studentId
 * @returns {Promise<Object>} { success, data, error }
 */
export const getStudentMarks = async (studentId) => {
  try {
    const response = await apiClient.get(`/teacher/marks/student/${studentId}`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch student marks';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Get student cumulative result & GPA calculation
 * @param {number|string} studentId
 * @returns {Promise<Object>} { success, data, error }
 */
export const getStudentResult = async (studentId) => {
  try {
    const response = await apiClient.get(`/teacher/marks/student/${studentId}/result`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to calculate student result';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

/**
 * Get class result summary for subject & exam
 * @param {Object} filters - { subject, examType, examName }
 * @returns {Promise<Object>} { success, data, error }
 */
export const getClassResultSummary = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.subject) queryParams.append('subject', filters.subject);
    if (filters.examType) queryParams.append('examType', filters.examType);
    if (filters.examName) queryParams.append('examName', filters.examName);

    const queryString = queryParams.toString();
    const url = `/teacher/marks/summary${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get(url);

    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch class result summary';
    return {
      success: false,
      status: error.response?.status,
      error: message
    };
  }
};

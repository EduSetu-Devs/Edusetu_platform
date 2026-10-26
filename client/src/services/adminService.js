import apiClient from './api';

// ==========================================
// 1. DASHBOARD & SYSTEM METRICS
// ==========================================
export const getAdminDashboard = async () => {
  try {
    const response = await apiClient.get('/admin/dashboard');
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch admin dashboard metrics'
    };
  }
};

// ==========================================
// 2. USER DIRECTORY
// ==========================================
export const getAdminUsers = async (params = {}) => {
  try {
    const response = await apiClient.get('/admin/users', { params });
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch users'
    };
  }
};

export const updateUserStatus = async (userId, status) => {
  try {
    const response = await apiClient.patch(`/admin/users/${userId}/status`, { status });
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update user status'
    };
  }
};

// ==========================================
// 3. TEACHER MANAGEMENT
// ==========================================
export const getAdminTeachers = async (params = {}) => {
  try {
    const response = await apiClient.get('/admin/teachers', { params });
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch teachers'
    };
  }
};

export const updateTeacherAssignment = async (teacherId, assignmentData) => {
  try {
    const response = await apiClient.put(`/admin/teachers/${teacherId}/assignment`, assignmentData);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update teacher assignment'
    };
  }
};

// ==========================================
// 4. STUDENT MANAGEMENT
// ==========================================
export const getAdminStudents = async (params = {}) => {
  try {
    const response = await apiClient.get('/admin/students', { params });
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch students'
    };
  }
};

export const updateStudentAssignment = async (studentId, assignmentData) => {
  try {
    const response = await apiClient.put(`/admin/students/${studentId}/assignment`, assignmentData);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update student assignment'
    };
  }
};

export const getAdminAgeVerificationRequests = async () => {
  try {
    const response = await apiClient.get('/admin/students/age-verification');
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch student age-verification requests'
    };
  }
};

export const reviewAdminStudentAge = async (studentProfileId, decision, reviewedDateOfBirth) => {
  try {
    const response = await apiClient.put(`/admin/students/${studentProfileId}/age-verification`, {
      decision,
      reviewedDateOfBirth,
      independentlyReviewed: true
    });
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to review student age eligibility'
    };
  }
};

// ==========================================
// 5. PARENT MANAGEMENT & CHILD LINKING
// ==========================================
export const getAdminParents = async (params = {}) => {
  try {
    const response = await apiClient.get('/admin/parents', { params });
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch parents'
    };
  }
};

export const linkParentChild = async (parentId, studentId, relationship = 'Child') => {
  try {
    const response = await apiClient.post(`/admin/parents/${parentId}/children`, {
      studentId,
      relationship
    });
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to link parent and child'
    };
  }
};

export const unlinkParentChild = async (parentId, studentId) => {
  try {
    const response = await apiClient.delete(`/admin/parents/${parentId}/children/${studentId}`);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to unlink parent and child'
    };
  }
};

// ==========================================
// 6. CLASS MANAGEMENT
// ==========================================
export const getAdminClasses = async () => {
  try {
    const response = await apiClient.get('/admin/classes');
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch classes'
    };
  }
};

export const createAdminClass = async (classData) => {
  try {
    const response = await apiClient.post('/admin/classes', classData);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create class'
    };
  }
};

export const updateAdminClass = async (id, classData) => {
  try {
    const response = await apiClient.put(`/admin/classes/${id}`, classData);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update class'
    };
  }
};

export const deleteAdminClass = async (id) => {
  try {
    const response = await apiClient.delete(`/admin/classes/${id}`);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete class'
    };
  }
};

// ==========================================
// 7. SECTION MANAGEMENT
// ==========================================
export const getAdminSections = async (classId = null) => {
  try {
    const response = await apiClient.get('/admin/sections', {
      params: classId ? { classId } : {}
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch sections'
    };
  }
};

export const createAdminSection = async (sectionData) => {
  try {
    const response = await apiClient.post('/admin/sections', sectionData);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create section'
    };
  }
};

export const updateAdminSection = async (id, sectionData) => {
  try {
    const response = await apiClient.put(`/admin/sections/${id}`, sectionData);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update section'
    };
  }
};

export const deleteAdminSection = async (id) => {
  try {
    const response = await apiClient.delete(`/admin/sections/${id}`);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete section'
    };
  }
};

// ==========================================
// 8. SUBJECT MANAGEMENT
// ==========================================
export const getAdminSubjects = async () => {
  try {
    const response = await apiClient.get('/admin/subjects');
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch subjects'
    };
  }
};

export const createAdminSubject = async (subjectData) => {
  try {
    const response = await apiClient.post('/admin/subjects', subjectData);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create subject'
    };
  }
};

export const updateAdminSubject = async (id, subjectData) => {
  try {
    const response = await apiClient.put(`/admin/subjects/${id}`, subjectData);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update subject'
    };
  }
};

export const deleteAdminSubject = async (id) => {
  try {
    const response = await apiClient.delete(`/admin/subjects/${id}`);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete subject'
    };
  }
};

export const getAdminMarketplaceBookings = async (params = {}) => {
  try {
    const response = await apiClient.get('/admin/marketplace/bookings', { params });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Failed to fetch marketplace bookings' };
  }
};

export const getAdminMarketplaceReports = async (params = {}) => {
  try {
    const response = await apiClient.get('/admin/marketplace/reports', { params });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Failed to fetch marketplace reports' };
  }
};

export const updateAdminMarketplaceReport = async (id, data) => {
  try {
    const response = await apiClient.patch(`/admin/marketplace/reports/${id}`, data);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Failed to update marketplace report' };
  }
};

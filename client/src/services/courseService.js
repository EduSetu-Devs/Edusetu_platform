import apiClient from './api';

/**
 * Fetch all available courses with optional search/filter
 */
export const getAllCourses = async (params = {}) => {
  try {
    const response = await apiClient.get('/courses', { params });
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch courses'
    };
  }
};

/**
 * Fetch details of a single course
 */
export const getCourseDetails = async (courseId) => {
  try {
    const response = await apiClient.get(`/courses/${courseId}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch course details'
    };
  }
};

/**
 * Enroll in a course (Student or Parent)
 */
export const enrollInCourse = async (courseId, studentProfileId = null) => {
  try {
    const payload = studentProfileId ? { studentProfileId } : {};
    const response = await apiClient.post(`/courses/${courseId}/enroll`, payload);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to enroll in course'
    };
  }
};

/**
 * Get courses enrolled by authenticated student
 */
export const getStudentEnrolledCourses = async () => {
  try {
    const response = await apiClient.get('/courses/student/enrolled');
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch enrolled courses'
    };
  }
};

/**
 * Get courses taught by authenticated teacher with student rosters
 */
export const getTeacherCourses = async () => {
  try {
    const response = await apiClient.get('/courses/teacher/my-courses');
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch teacher courses'
    };
  }
};

/**
 * Teacher creates a new course / batch
 */
export const createTeacherCourse = async (courseData) => {
  try {
    const response = await apiClient.post('/courses/teacher/create', courseData);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create course'
    };
  }
};

/**
 * Parent fetches enrolled courses of their linked child
 */
export const getChildEnrolledCourses = async (studentId) => {
  try {
    const response = await apiClient.get(`/courses/parent/children/${studentId}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch child enrolled courses'
    };
  }
};

/**
 * Admin overview of all courses and platform enrollment metrics
 */
export const getAdminCoursesOverview = async () => {
  try {
    const response = await apiClient.get('/courses/admin/overview');
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch admin course overview'
    };
  }
};

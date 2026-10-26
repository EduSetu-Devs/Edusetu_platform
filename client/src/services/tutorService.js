import apiClient from './api';

// Public Tutor Search & Profiles
export const searchTutors = async (params = {}) => {
  try {
    const response = await apiClient.get('/tutors', { params });
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to search tutors'
    };
  }
};

export const getRecommendedTutors = async (params = {}) => {
  try {
    const response = await apiClient.get('/tutors/recommended', { params });
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to load teacher recommendations'
    };
  }
};

export const getTutorById = async (id) => {
  try {
    const response = await apiClient.get(`/tutors/${id}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to load tutor details'
    };
  }
};

export const compareTutors = async (tutorIds) => {
  try {
    const response = await apiClient.post('/tutors/compare', { tutorIds });
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to compare tutors'
    };
  }
};

// Teacher Tutor Profile Management
export const getMyTutorProfile = async () => {
  try {
    const response = await apiClient.get('/tutor/my-profile');
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch tutor profile'
    };
  }
};

export const saveTutorProfile = async (profileData) => {
  try {
    const response = await apiClient.post('/tutor/profile', profileData);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to save tutor profile'
    };
  }
};

export const saveTutorSubjects = async (subjects) => {
  try {
    const response = await apiClient.post('/tutor/subjects', { subjects });
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to save subjects'
    };
  }
};

export const saveTutorAvailability = async (availabilities) => {
  try {
    const response = await apiClient.post('/tutor/availability', { availabilities });
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to save availability schedule'
    };
  }
};

export const submitTutorVerification = async (verificationData) => {
  try {
    const response = await apiClient.post('/tutor/submit-verification', verificationData);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to submit for verification'
    };
  }
};

// Tutor Hiring Requests
export const getTutorAssignmentEligibility = async () => {
  try {
    const response = await apiClient.get('/tutor/assignment-eligibility');
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to check tutor assignment eligibility'
    };
  }
};

export const sendTutorRequest = async (requestData) => {
  try {
    const response = await apiClient.post('/tutor/requests', requestData);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to send tutor request'
    };
  }
};

export const getMyRequests = async () => {
  try {
    const response = await apiClient.get('/tutor/my-requests');
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch your tutor requests'
    };
  }
};

export const getIncomingRequests = async () => {
  try {
    const response = await apiClient.get('/tutor/incoming-requests');
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch incoming requests'
    };
  }
};

export const acceptTutorRequest = async (requestId, responseMessage) => {
  try {
    const response = await apiClient.put(`/tutor/requests/${requestId}/accept`, { responseMessage });
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to accept tutor request'
    };
  }
};

export const rejectTutorRequest = async (requestId, responseMessage) => {
  try {
    const response = await apiClient.put(`/tutor/requests/${requestId}/reject`, { responseMessage });
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to decline tutor request'
    };
  }
};

export const cancelTutorRequest = async (requestId) => {
  try {
    const response = await apiClient.put(`/tutor/requests/${requestId}/cancel`);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to cancel tutor request'
    };
  }
};

export const getTutorBookingSlots = async (requestId, params) => {
  try {
    const response = await apiClient.get(`/tutor/requests/${requestId}/available-slots`, { params });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || error.message || 'Failed to load available slots' };
  }
};

export const createTutorBooking = async (bookingData) => {
  try {
    const response = await apiClient.post('/tutor/bookings', bookingData);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || error.message || 'Failed to request class booking' };
  }
};

export const getTutorBookings = async () => {
  try {
    const response = await apiClient.get('/tutor/bookings');
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || error.message || 'Failed to load class bookings' };
  }
};

export const confirmTutorBooking = async (bookingId) => {
  try {
    const response = await apiClient.patch(`/tutor/bookings/${bookingId}/confirm`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || error.message || 'Failed to confirm class booking' };
  }
};

export const rejectTutorBooking = async (bookingId, reason) => {
  try {
    const response = await apiClient.patch(`/tutor/bookings/${bookingId}/reject`, { reason });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || error.message || 'Failed to decline class booking' };
  }
};

export const rescheduleTutorBooking = async (bookingId, schedule) => {
  try {
    const response = await apiClient.patch(`/tutor/bookings/${bookingId}/reschedule`, schedule);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || error.message || 'Failed to request reschedule' };
  }
};

export const cancelTutorBooking = async (bookingId, reason) => {
  try {
    const response = await apiClient.patch(`/tutor/bookings/${bookingId}/cancel`, { reason });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || error.message || 'Failed to cancel class booking' };
  }
};

export const reportTutorBooking = async (bookingId, report) => {
  try {
    const response = await apiClient.post(`/tutor/bookings/${bookingId}/reports`, report);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || error.message || 'Failed to report booking issue' };
  }
};

// Reviews & Ratings
export const getTutorReviews = async (tutorProfileId) => {
  try {
    const response = await apiClient.get(`/tutors/${tutorProfileId}/reviews`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch reviews'
    };
  }
};

export const getReviewableTutorSessions = async (tutorProfileId) => {
  try {
    const response = await apiClient.get(`/tutors/${tutorProfileId}/reviewable-sessions`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to load completed sessions'
    };
  }
};

export const submitTutorReview = async (tutorProfileId, reviewData) => {
  try {
    const response = await apiClient.post(`/tutors/${tutorProfileId}/reviews`, reviewData);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to submit review'
    };
  }
};

// Shortlisting
export const toggleTutorShortlist = async (tutorProfileId, notes = '') => {
  try {
    const response = await apiClient.post(`/tutors/${tutorProfileId}/shortlist`, { notes });
    return { success: true, isShortlisted: response.data.isShortlisted, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to update shortlist'
    };
  }
};

export const getMyShortlist = async () => {
  try {
    const response = await apiClient.get('/tutors/my-shortlist');
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch shortlist'
    };
  }
};

// Admin Tutor Verification
export const getPendingVerifications = async (status = 'pending_verification') => {
  try {
    const response = await apiClient.get('/admin/tutors/pending', { params: { status } });
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch verifications'
    };
  }
};

export const verifyTutorAdmin = async (tutorProfileId, notes = '') => {
  try {
    const response = await apiClient.put(`/admin/tutors/${tutorProfileId}/verify`, { notes });
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to verify tutor'
    };
  }
};

export const rejectTutorAdmin = async (tutorProfileId, reason = '') => {
  try {
    const response = await apiClient.put(`/admin/tutors/${tutorProfileId}/reject`, { reason });
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to reject verification'
    };
  }
};

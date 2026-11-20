import apiClient from './api';

/**
 * Authentication is carried by an HttpOnly, SameSite session cookie.
 * No JWT is stored in localStorage/sessionStorage.
 */

/**
 * Register a new user (development-only legacy endpoint; production requires OTP).
 * @param {Object} userData - { name, email, password, role, phone }
 */
export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    const { user } = response.data.data;
    return { success: true, data: { user } };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Registration failed';
    return { success: false, error: message };
  }
};

/**
 * Send Email Verification OTP for registration
 * @param {Object} userData - { name, email, password, role, phone, acceptedTerms, acceptedPrivacy }
 */
export const sendRegistrationOtp = async (userData) => {
  try {
    const response = await apiClient.post('/auth/send-otp', userData);
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to send verification OTP';
    return { success: false, error: message, retryAfter: error.response?.headers?.['retry-after'] };
  }
};

/**
 * Verify OTP and complete registration
 * @param {Object} verificationData - { email, otp }
 */
export const verifyAndRegisterOtp = async (verificationData) => {
  try {
    const response = await apiClient.post('/auth/verify-otp', verificationData);
    const { user } = response.data.data;
    return { success: true, data: { user } };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'OTP verification failed';
    return { success: false, error: message };
  }
};

/**
 * Login user with email & password
 * @param {Object} credentials - { email, password }
 */
export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    const { user } = response.data.data;
    return { success: true, data: { user } };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Login failed';
    return { success: false, error: message };
  }
};

/**
 * Fetch currently authenticated user profile
 */
export const getCurrentUserProfile = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    const user = response.data.data;
    return { success: true, data: user };
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch user';
    return { success: false, error: message, status: error.response?.status };
  }
};

/**
 * Test Role Authorization endpoint
 * @param {String} role - 'admin' or 'teacher'
 */
export const testRoleEndpoint = async (role) => {
  try {
    const response = await apiClient.get(`/auth/test-role/${role}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      message: error.response?.data?.message || 'Access denied'
    };
  }
};

/**
 * Verify Admin Verification Password for protected Administrator portal access
 * @param {String} verificationPassword
 */
export const verifyAdminSecretPassword = async (verificationPassword) => {
  try {
    const response = await apiClient.post('/auth/admin/verify', { verificationPassword });
    return { success: true, data: response.data.data };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Invalid admin verification.';
    return { success: false, error: message };
  }
};

/**
 * Authenticate Administrator with Credentials and Verification Token
 * @param {Object} credentials - { email, password, adminVerificationToken }
 */
export const adminLoginUser = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/admin/login', credentials);
    const { user } = response.data.data;
    return { success: true, data: { user } };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Admin login failed';
    return { success: false, error: message };
  }
};

/**
 * Log in / register with Firebase Google Auth
 * @param {string} idToken
 * @param {string} role - 'student' | 'teacher' | 'parent'
 */
export const firebaseLoginUser = async (idToken, role = 'student') => {
  try {
    const response = await apiClient.post('/auth/firebase-login', { idToken, role });
    const { user } = response.data.data;
    return { success: true, data: { user } };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Google sign-in failed';
    return { success: false, error: message };
  }
};

/**
 * Log out user: revokes the browser session cookie server-side.
 */
export const logoutUser = async () => {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // Even if the network call fails, local state is cleared by AuthContext.
  }
};

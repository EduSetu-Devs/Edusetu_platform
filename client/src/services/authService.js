import apiClient from './api';

const TOKEN_KEY = 'edusetu_auth_token';
const USER_KEY = 'edusetu_auth_user';

/**
 * Token & User Storage Helpers (localStorage for dev/MVP phase, easily upgradable to HttpOnly cookies)
 */
export const getStoredToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const removeStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const removeStoredUser = () => {
  localStorage.removeItem(USER_KEY);
};

// Configure Axios Request Interceptor to automatically attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Register a new user
 * @param {Object} userData - { name, email, password, role, phone }
 */
export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    const { user, token } = response.data.data;
    setStoredToken(token);
    setStoredUser(user);
    return { success: true, data: { user, token } };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Registration failed';
    return { success: false, error: message };
  }
};

/**
 * Send Email Verification OTP for registration
 * @param {Object} userData - { name, email, password, role, phone }
 */
export const sendRegistrationOtp = async (userData) => {
  try {
    const response = await apiClient.post('/auth/send-otp', userData);
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to send verification OTP';
    return { success: false, error: message };
  }
};

/**
 * Verify OTP and complete registration
 * @param {Object} verificationData - { email, otp }
 */
export const verifyAndRegisterOtp = async (verificationData) => {
  try {
    const response = await apiClient.post('/auth/verify-otp', verificationData);
    const { user, token } = response.data.data;
    setStoredToken(token);
    setStoredUser(user);
    return { success: true, data: { user, token } };
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
    const { user, token } = response.data.data;
    setStoredToken(token);
    setStoredUser(user);
    return { success: true, data: { user, token } };
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
    setStoredUser(user);
    return { success: true, data: user };
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch user';
    return { success: false, error: message };
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
    const { user, token } = response.data.data;
    setStoredToken(token);
    setStoredUser(user);
    return { success: true, data: { user, token } };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Admin login failed';
    return { success: false, error: message };
  }
};

/**
 * Log out user: clears tokens & state
 */
export const logoutUser = () => {
  removeStoredToken();
  removeStoredUser();
};

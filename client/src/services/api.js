import axios from 'axios';

// Get API base URL from Vite environment variables or fallback to local default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && window.location.origin ? `${window.location.origin}/api` : 'http://localhost:5000/api');

// Create a configured Axios instance. Credentials are required for the HttpOnly session cookie.
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 60000
});

const readCookie = (name) => {
  if (typeof document === 'undefined') return '';
  const prefix = `${name}=`;
  const match = document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  if (!match) return '';
  try {
    return decodeURIComponent(match.slice(prefix.length));
  } catch {
    return '';
  }
};

const CSRF_COOKIE_NAME = import.meta.env.VITE_CSRF_COOKIE_NAME || 'edusetu_csrf';

apiClient.interceptors.request.use(
  (config) => {
    const method = String(config.method || 'get').toLowerCase();
    if (!['get', 'head', 'options'].includes(method)) {
      const csrfToken = readCookie(CSRF_COOKIE_NAME);
      if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    if (status === 401 && !requestUrl.includes('/auth/login') && !requestUrl.includes('/auth/me')) {
      window.dispatchEvent(new CustomEvent('edusetu:unauthorized'));
    }
    return Promise.reject(error);
  }
);

/**
 * Health check service to verify backend connection
 */
export const checkBackendHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return {
      connected: true,
      data: response.data
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message || 'Unable to connect to backend server'
    };
  }
};

/**
 * Check MySQL / Sequelize database health status (/api/health/db)
 */
export const checkDatabaseStatus = async () => {
  try {
    const response = await apiClient.get('/health/db');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Unable to check database status'
    };
  }
};

/**
 * Check User schema validation test (/api/test/user-schema)
 */
export const checkUserSchemaStatus = async () => {
  try {
    const response = await apiClient.get('/test/user-schema');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Unable to check user schema'
    };
  }
};

/**
 * Get API metadata and overview (/api)
 */
export const getApiOverview = async () => {
  try {
    const response = await apiClient.get('/');
    return {
      connected: true,
      data: response.data
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message || 'Unable to fetch API overview'
    };
  }
};

export default apiClient;

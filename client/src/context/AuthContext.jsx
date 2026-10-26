import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  removeStoredToken,
  removeStoredUser,
  loginUser,
  adminLoginUser,
  registerUser,
  getCurrentUserProfile,
  logoutUser
} from '../services/authService';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (token) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [token]);

  // Initialize and verify authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getStoredToken();
      if (storedToken) {
        setToken(storedToken);
        const result = await getCurrentUserProfile();
        if (result.success) {
          setUser(result.data);
        } else {
          // Token is expired or invalid
          logoutUser();
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setAuthError(null);
    const result = await loginUser({ email, password });
    if (result.success) {
      setUser(result.data.user);
      setToken(result.data.token);
      return { success: true, user: result.data.user };
    } else {
      setAuthError(result.error);
      return { success: false, error: result.error };
    }
  };

  // Admin login handler (with verification token)
  const adminLogin = async (email, password, adminVerificationToken) => {
    setAuthError(null);
    const result = await adminLoginUser({ email, password, adminVerificationToken });
    if (result.success) {
      setUser(result.data.user);
      setToken(result.data.token);
      return { success: true, user: result.data.user };
    } else {
      setAuthError(result.error);
      return { success: false, error: result.error };
    }
  };

  // Register handler
  const register = async (formData) => {
    setAuthError(null);
    const result = await registerUser(formData);
    if (result.success) {
      setUser(result.data.user);
      setToken(result.data.token);
      return { success: true, user: result.data.user };
    } else {
      setAuthError(result.error);
      return { success: false, error: result.error };
    }
  };

  // Logout handler
  const logout = () => {
    logoutUser();
    setUser(null);
    setToken(null);
    setAuthError(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    authError,
    setAuthError,
    login,
    adminLogin,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

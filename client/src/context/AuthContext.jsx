import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginUser,
  adminLoginUser,
  registerUser,
  sendRegistrationOtp,
  verifyAndRegisterOtp,
  firebaseLoginUser,
  getCurrentUserProfile,
  logoutUser
} from '../services/authService';
import { signInWithGoogle } from '../config/firebase';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const clearLocalSession = useCallback(() => {
    setUser(null);
    setAuthError(null);
    disconnectSocket();
  }, []);

  // Validate the HttpOnly cookie session on mount. There is no token in JS storage.
  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      const result = await getCurrentUserProfile();
      if (cancelled) return;

      if (result.success) {
        setUser(result.data);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    initializeAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  // Connect the WebSocket once an authenticated session exists.
  useEffect(() => {
    if (user) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [user]);

  useEffect(() => {
    const handleUnauthorized = () => clearLocalSession();
    window.addEventListener('edusetu:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('edusetu:unauthorized', handleUnauthorized);
  }, [clearLocalSession]);

  const login = async (email, password) => {
    setAuthError(null);
    const result = await loginUser({ email, password });
    if (result.success) {
      setUser(result.data.user);
      return { success: true, user: result.data.user };
    }
    setAuthError(result.error);
    return { success: false, error: result.error };
  };

  const adminLogin = async (email, password, adminVerificationToken) => {
    setAuthError(null);
    const result = await adminLoginUser({ email, password, adminVerificationToken });
    if (result.success) {
      setUser(result.data.user);
      return { success: true, user: result.data.user };
    }
    setAuthError(result.error);
    return { success: false, error: result.error };
  };

  const register = async (formData) => {
    setAuthError(null);
    const result = await registerUser(formData);
    if (result.success) {
      setUser(result.data.user);
      return { success: true, user: result.data.user };
    }
    setAuthError(result.error);
    return { success: false, error: result.error };
  };

  const sendOtp = async (userData) => {
    setAuthError(null);
    const result = await sendRegistrationOtp(userData);
    if (!result.success) setAuthError(result.error);
    return result;
  };

  const verifyOtp = async (verificationData) => {
    setAuthError(null);
    const result = await verifyAndRegisterOtp(verificationData);
    if (result.success) {
      setUser(result.data.user);
      return { success: true, user: result.data.user };
    }
    setAuthError(result.error);
    return { success: false, error: result.error };
  };

  const loginWithGoogle = async (role = 'student') => {
    setAuthError(null);
    try {
      const res = await signInWithGoogle();
      const idToken = await res.user.getIdToken();
      const result = await firebaseLoginUser(idToken, role);
      if (result.success) {
        setUser(result.data.user);
        return { success: true, user: result.data.user };
      }
      setAuthError(result.error);
      return { success: false, error: result.error };
    } catch (err) {
      const msg = err.message || 'Google sign-in cancelled or failed';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    await logoutUser();
    clearLocalSession();
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    authError,
    setAuthError,
    login,
    loginWithGoogle,
    adminLogin,
    register,
    sendOtp,
    verifyOtp,
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

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
import {
  signInWithGoogle,
  getGoogleRedirectResult,
  getPendingGoogleRole,
  clearPendingGoogleRole,
  loginWithEmailFirebase,
  registerWithEmailFirebase
} from '../config/firebase';
import { syncUserProfileFirestore } from '../services/firestoreService';
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

  const formatFirebaseAuthError = useCallback((err) => {
    console.error('[Firebase Google Sign-In Error Code]:', err?.code, err?.message);
    if (err?.code === 'auth/popup-closed-by-user') {
      return 'Google sign-in popup was closed before completing.';
    }
    if (err?.code === 'auth/unauthorized-domain') {
      return `This domain (${typeof window !== 'undefined' ? window.location.hostname : 'current domain'}) is not authorized in Firebase Console -> Authentication -> Settings -> Authorized domains.`;
    }
    if (err?.code === 'auth/configuration-not-found' || err?.code === 'auth/operation-not-allowed') {
      return 'Google sign-in is not allowed. Please verify Google is Enabled under Sign-in method in Firebase Console.';
    }
    if (err?.message) {
      return `Google sign-in notice: ${err.message}`;
    }
    return 'Google sign-in was cancelled or encountered an error.';
  }, []);

  const completeFirebaseGoogleSession = useCallback(async (firebaseUser, role = 'student') => {
    const idToken = await firebaseUser.getIdToken();
    const result = await firebaseLoginUser(idToken, role);
    if (result.success) {
      await syncUserProfileFirestore(result.data.user, { role }).catch(() => {});
      setUser(result.data.user);
      return { success: true, user: result.data.user };
    }
    setAuthError(result.error);
    return { success: false, error: result.error };
  }, []);

  // Validate the HttpOnly cookie session (or complete a pending Google redirect) on mount.
  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      try {
        const redirectResult = await getGoogleRedirectResult();
        if (!cancelled && redirectResult?.user) {
          const pendingRole = getPendingGoogleRole();
          clearPendingGoogleRole();
          await completeFirebaseGoogleSession(redirectResult.user, pendingRole);
          if (!cancelled) setIsLoading(false);
          return;
        }
      } catch (err) {
        clearPendingGoogleRole();
        if (!cancelled) setAuthError(formatFirebaseAuthError(err));
      }

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
  }, [completeFirebaseGoogleSession, formatFirebaseAuthError]);

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
      const res = await signInWithGoogle(role);
      if (res?.redirected) {
        return { success: false, redirected: true };
      }
      if (!res?.user) {
        throw new Error('Google sign-in did not return a user.');
      }
      return await completeFirebaseGoogleSession(res.user, role);
    } catch (err) {
      const userFriendlyMsg = formatFirebaseAuthError(err);
      setAuthError(userFriendlyMsg);
      return { success: false, error: userFriendlyMsg };
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

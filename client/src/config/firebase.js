import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBor7DCwDASa4ZhMjqRcSPPGFvtTlLqsWI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "loyal-synthesis-477817-e7.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "loyal-synthesis-477817-e7",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "loyal-synthesis-477817-e7.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "684722058461",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:684722058461:web:99fe73150e6d8bef66d734",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-D5QJKH1CLF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const PENDING_GOOGLE_ROLE_KEY = 'edusetu_google_pending_role';

export const getPendingGoogleRole = () => {
  try {
    return sessionStorage.getItem(PENDING_GOOGLE_ROLE_KEY) || 'student';
  } catch {
    return 'student';
  }
};

export const clearPendingGoogleRole = () => {
  try {
    sessionStorage.removeItem(PENDING_GOOGLE_ROLE_KEY);
  } catch {
    // Ignore storage errors in restricted contexts
  }
};

// Firebase Authentication Helpers: popup with fallback to redirect
export const signInWithGoogle = async (role = 'student') => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (popupErr) {
    console.warn('[Firebase Google Auth] Popup failed, checking fallback:', popupErr);
    // If popup is blocked, restricted, or throws internal-error due to cross-origin iframe blocking
    if (popupErr.code === 'auth/internal-error' || popupErr.code === 'auth/popup-blocked') {
      try {
        try {
          sessionStorage.setItem(PENDING_GOOGLE_ROLE_KEY, role);
        } catch {
          // Ignore storage errors
        }
        await signInWithRedirect(auth, googleProvider);
        return { redirected: true };
      } catch (redirectErr) {
        clearPendingGoogleRole();
        throw popupErr;
      }
    }
    throw popupErr;
  }
};

export const getGoogleRedirectResult = () => getRedirectResult(auth);
export const loginWithEmailFirebase = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const registerWithEmailFirebase = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const resetPasswordFirebase = (email) => sendPasswordResetEmail(auth, email);

export default app;

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBor7DCwDASa4ZhMjqRcSPPGfvtTlLqsWI",
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

// Firebase Authentication Helpers
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const loginWithEmailFirebase = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const registerWithEmailFirebase = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const resetPasswordFirebase = (email) => sendPasswordResetEmail(auth, email);

export default app;

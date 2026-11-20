import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Sync or create user profile in Firestore
 */
export const syncUserProfileFirestore = async (user, additionalData = {}) => {
  if (!user?.uid && !user?.id) return;
  const uid = user.uid || String(user.id);
  const userRef = doc(db, 'users', uid);

  const profileData = {
    uid,
    name: user.name || user.displayName || 'User',
    email: user.email || '',
    role: user.role || additionalData.role || 'student',
    profileImage: user.photoURL || user.profileImage || '',
    updatedAt: serverTimestamp(),
    ...additionalData
  };

  await setDoc(userRef, profileData, { merge: true });
  return profileData;
};

/**
 * Fetch user profile from Firestore
 */
export const getUserProfileFirestore = async (uid) => {
  const docSnap = await getDoc(doc(db, 'users', uid));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

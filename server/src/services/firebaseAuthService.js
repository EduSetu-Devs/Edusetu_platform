let admin = null;
try {
  admin = require('firebase-admin');
} catch (err) {
  console.warn('[Firebase] firebase-admin package not available');
}

let isInitialized = false;

const initFirebase = () => {
  if (isInitialized || !admin) return;

  const projectId = process.env.FIREBASE_PROJECT_ID || 'loyal-synthesis-477817-e7';

  // Option 1: Service Account JSON provided via env
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId
      });
      isInitialized = true;
      console.log('[Firebase] Admin SDK initialized via FIREBASE_SERVICE_ACCOUNT');
      return;
    } catch (err) {
      console.warn('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT:', err.message);
    }
  }

  // Option 2: Default application credentials or project ID fallback
  try {
    admin.initializeApp({
      projectId
    });
    isInitialized = true;
    console.log('[Firebase] Admin SDK initialized with projectId:', projectId);
  } catch (err) {
    console.warn('[Firebase] Default initialization note:', err.message);
  }
};

initFirebase();

const verifyIdToken = async (idToken) => {
  if (!admin || !isInitialized) {
    throw new Error('Firebase Admin SDK is not initialized');
  }
  return await admin.auth().verifyIdToken(idToken);
};

module.exports = {
  verifyIdToken,
  admin
};

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

let appInstance: FirebaseApp | null = null;

export const getFirebaseApp = (): FirebaseApp => {
  if (appInstance) return appInstance;
  
  // Your web app's Firebase configuration from environment variables
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  // Validate required config
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.storageBucket || !firebaseConfig.messagingSenderId || !firebaseConfig.appId) {
    throw new Error("Firebase config is missing. Ensure .env.local is set with NEXT_PUBLIC_FIREBASE_* variables.");
  }

  const existing = getApps();
  appInstance = existing.length ? existing[0]! : initializeApp(firebaseConfig);
  return appInstance;
};

export const getDb = (): Firestore => getFirestore(getFirebaseApp());
export const getAuthInstance = (): Auth => getAuth(getFirebaseApp());
export const getStorageInstance = (): FirebaseStorage => getStorage(getFirebaseApp());

// Re-export auth functions for convenience
export { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

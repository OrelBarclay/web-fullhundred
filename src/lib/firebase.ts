import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

let appInstance: FirebaseApp | null = null;

export const getFirebaseApp = (): FirebaseApp => {
  if (appInstance) return appInstance;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    throw new Error("Firebase config is missing. Ensure .env.local is set.");
  }

  const existing = getApps();
  appInstance = existing.length ? existing[0]! : initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  });
  return appInstance;
};

export const getDb = (): Firestore => getFirestore(getFirebaseApp());
export const getAuthInstance = (): Auth => getAuth(getFirebaseApp());
export const getStorageInstance = (): FirebaseStorage => getStorage(getFirebaseApp());

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

let appInstance: FirebaseApp | null = null;

export const getFirebaseApp = (): FirebaseApp => {
  if (appInstance) return appInstance;
  
  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDMyQTg7F9-LJXNV2iwOWXPJlVwoFY-GDw",
    authDomain: "fullhundred-e1487.firebaseapp.com",
    projectId: "fullhundred-e1487",
    storageBucket: "fullhundred-e1487.firebasestorage.app",
    messagingSenderId: "774067863491",
    appId: "1:774067863491:web:d6ef0f6a7a79b81a644776",
    measurementId: "G-NQF81WTR83"
  };

  const existing = getApps();
  appInstance = existing.length ? existing[0]! : initializeApp(firebaseConfig);
  return appInstance;
};

export const getDb = (): Firestore => getFirestore(getFirebaseApp());
export const getAuthInstance = (): Auth => getAuth(getFirebaseApp());
export const getStorageInstance = (): FirebaseStorage => getStorage(getFirebaseApp());

// Re-export auth functions for convenience
export { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

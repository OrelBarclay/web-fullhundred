import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

let adminApp: App | null = null;

export const getFirebaseAdmin = (): App => {
  if (adminApp) return adminApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  console.log('Firebase Admin Config Check:', {
    projectId: projectId ? 'present' : 'missing',
    clientEmail: clientEmail ? 'present' : 'missing',
    privateKey: privateKey ? 'present' : 'missing',
    privateKeyLength: privateKey?.length || 0
  });

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin environment variables');
  }

  try {
    const existing = getApps();
    adminApp = existing.length ? existing[0]! : initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    }, 'admin');
    
    console.log('Firebase Admin initialized successfully');
    return adminApp;
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
};

export const getAdminAuth = (): Auth => {
  try {
    const app = getFirebaseAdmin();
    const auth = getAuth(app);
    console.log('Firebase Admin Auth initialized successfully');
    return auth;
  } catch (error) {
    console.error('Firebase Admin Auth initialization error:', error);
    throw error;
  }
};

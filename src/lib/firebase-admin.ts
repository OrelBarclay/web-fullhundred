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

  if (!projectId) {
    throw new Error('Missing FIREBASE_PROJECT_ID environment variable');
  }

  try {
    const existing = getApps();
    
    if (existing.length > 0) {
      adminApp = existing[0]!;
      console.log('Using existing Firebase Admin app');
      return adminApp;
    }

    // Try service account credentials first
    if (clientEmail && privateKey) {
      try {
        adminApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        }, 'admin');
        console.log('Firebase Admin initialized with service account credentials');
        return adminApp;
      } catch (serviceAccountError) {
        console.warn('Service account initialization failed, trying application default credentials:', serviceAccountError);
      }
    }

    // Fallback: Use application default credentials
    try {
      adminApp = initializeApp({
        projectId,
        // This will use GOOGLE_APPLICATION_CREDENTIALS or default service account
      }, 'admin');
      console.log('Firebase Admin initialized with application default credentials');
      return adminApp;
    } catch (defaultCredError) {
      console.error('Application default credentials also failed:', defaultCredError);
      throw new Error('Failed to initialize Firebase Admin with any authentication method');
    }
    
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

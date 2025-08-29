import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test environment variables
    const envCheck = {
      projectId: process.env.FIREBASE_PROJECT_ID ? 'present' : 'missing',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'present' : 'missing',
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'present' : 'missing',
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV
    };
    
    console.log('Environment check:', envCheck);
    
    // Test Firebase Admin initialization
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const adminApp = getFirebaseAdmin();
      console.log('Firebase Admin app initialized:', adminApp.name);
      
      // Test Auth initialization
      const { getAdminAuth } = await import('@/lib/firebase-admin');
      const adminAuth = getAdminAuth();
      console.log('Firebase Admin Auth initialized');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Firebase Admin initialized successfully',
        envCheck,
        appName: adminApp.name
      });
    } catch (firebaseError) {
      console.error('Firebase Admin test failed:', firebaseError);
      return NextResponse.json({ 
        success: false, 
        error: 'Firebase Admin initialization failed',
        errorMessage: firebaseError instanceof Error ? firebaseError.message : 'Unknown error',
        envCheck
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Test API failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

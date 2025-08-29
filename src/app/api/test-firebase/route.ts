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
      
      // Test Firestore connectivity
      try {
        const { getFirestore } = await import('firebase-admin/firestore');
        const db = getFirestore(adminApp);
        console.log('Firestore instance created');
        
        // Test a simple Firestore operation
        const testCollection = db.collection('_test_connection');
        const testDoc = await testCollection.doc('test').get();
        console.log('Firestore read test successful');
        
        // Clean up test document
        await testCollection.doc('test').delete();
        console.log('Firestore cleanup successful');
        
        return NextResponse.json({ 
          success: true, 
          message: 'Firebase Admin and Firestore working correctly',
          envCheck,
          appName: adminApp.name,
          firestoreTest: 'passed'
        });
        
      } catch (firestoreError) {
        console.error('Firestore test failed:', firestoreError);
        return NextResponse.json({ 
          success: false, 
          error: 'Firestore connectivity failed',
          errorMessage: firestoreError instanceof Error ? firestoreError.message : 'Unknown error',
          errorCode: (firestoreError as { code?: number })?.code,
          errorDetails: (firestoreError as { details?: string })?.details,
          envCheck,
          appName: adminApp.name
        }, { status: 500 });
      }
      
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

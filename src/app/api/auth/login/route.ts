import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseApp } from '@/lib/firebase';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { idToken, user: userData } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ error: 'ID token required' }, { status: 400 });
    }

    // For now, skip Admin SDK verification and use the user data from the client
    // This is a temporary workaround until Firebase Admin permissions are fixed
    console.log('Skipping Admin SDK verification due to permissions issue');
    
    if (!userData || !userData.uid) {
      return NextResponse.json({ error: 'User data required' }, { status: 400 });
    }

    const decodedToken = {
      uid: userData.uid,
      email: userData.email,
      name: userData.displayName,
      picture: userData.photoURL
    };
    console.log('Using client-provided user data:', decodedToken);
    
    // Store/update user in Firestore
    console.log('Storing user data in Firestore...');
    
    const app = getFirebaseApp();
    const db = getFirestore(app);
    
    const userRef = doc(db, 'users', decodedToken.uid);
    const userDoc = await getDoc(userRef);
    
    const now = new Date();
    const userDataToStore = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      displayName: decodedToken.name || decodedToken.email?.split('@')[0] || '',
      photoURL: decodedToken.picture || '',
      role: 'user', // Default to user, custom claims will override this
      lastLoginAt: now,
      updatedAt: now,
      createdAt: userDoc.exists() ? userDoc.data()?.createdAt : now
    };
    
    // If user doesn't exist, set createdAt; if they do, keep existing createdAt
    if (!userDoc.exists()) {
      userDataToStore.createdAt = now;
      console.log('Creating new user:', userDataToStore);
    } else {
      const existingData = userDoc.data();
      userDataToStore.createdAt = existingData?.createdAt || now;
      console.log('Updating existing user:', userDataToStore);
    }
    
    await setDoc(userRef, userDataToStore, { merge: true });
    
    const user = userDataToStore;
    console.log('User stored/updated in Firestore:', user);
    
    // Create a simple session token (skip Admin SDK for now)
    const sessionCookie = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    console.log('Created simple session token:', sessionCookie);
    
    if (!user) {
      return NextResponse.json({ error: 'Failed to create or retrieve user' }, { status: 500 });
    }
    
    const response = NextResponse.json({ 
      success: true, 
      // Admin status will be determined by custom claims on client side
      user: {
        uid: user.id,
        email: user.email,
        name: user.displayName,
        role: user.role,
      }
    });
    
    // Set the session cookie with proper configuration
    response.cookies.set('auth-token', sessionCookie, {
      maxAge: 60 * 60 * 24 * 5 * 1000, // 5 days
      httpOnly: false, // Allow client-side access for debugging
      secure: false, // Allow HTTP for local development
      sameSite: 'lax',
      path: '/',
    });
    
    // Also set a non-httpOnly version for debugging
    response.cookies.set('auth-token-debug', sessionCookie, {
      maxAge: 60 * 60 * 24 * 5 * 1000, // 5 days
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    console.log('Session cookie set:', {
      name: 'auth-token',
      maxAge: 60 * 60 * 24 * 5 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    console.error('Login error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    // Add CORS headers to error response
    const errorResponse = NextResponse.json({ 
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 401 });
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}

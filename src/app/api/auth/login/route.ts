import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseApp } from '@/lib/firebase';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { isUserAdmin } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  ;
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
    
    if (!userData || !userData.uid) {
      return NextResponse.json({ error: 'User data required' }, { status: 400 });
    }

    const decodedToken = {
      uid: userData.uid,
      email: userData.email,
      name: userData.displayName,
      picture: userData.photoURL
    };
    // Store/update user in Firestore
    
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
      isAdmin: false, // Default to false, will be updated based on role
      lastLoginAt: now,
      updatedAt: now,
      createdAt: userDoc.exists() ? userDoc.data()?.createdAt : now
    };
    
    // If user doesn't exist, set createdAt; if they do, keep existing createdAt and role
    if (!userDoc.exists()) {
      userDataToStore.createdAt = now;
    } else {
      const existingData = userDoc.data();
      userDataToStore.createdAt = existingData?.createdAt || now;
      userDataToStore.role = existingData?.role || 'user';
      userDataToStore.isAdmin = existingData?.isAdmin || false;
    }
    
    await setDoc(userRef, userDataToStore, { merge: true });
    
    const user = userDataToStore;
    
    // Check if user is admin using custom claims
    // For now, we'll check the user's role in Firestore and custom claims
    let isAdminUser = false;
    
    // Check if user has admin role in Firestore
    if (user.role === 'admin' || user.isAdmin) {
      isAdminUser = true;
    }
    
    // Also check for temporary admin access (until custom claims are properly set)
    if (decodedToken.email === 'coolbarclay@gmail.com') {
      isAdminUser = true;
    }
    
    // Create session token with admin status
    const sessionCookie = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${isAdminUser ? 'admin' : 'user'}`;
    
    if (!user) {
      return NextResponse.json({ error: 'Failed to create or retrieve user' }, { status: 500 });
    }
    
    const response = NextResponse.json({ 
      success: true, 
      isAdmin: isAdminUser,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        role: user.role,
        isAdmin: isAdminUser
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
    
    
    return response;
  } catch (error) {
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

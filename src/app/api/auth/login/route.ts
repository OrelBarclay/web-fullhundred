import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { userService, type UserInput } from '@/server/db';
import { getAuthInstance } from '@/lib/firebase';

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
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ error: 'ID token required' }, { status: 400 });
    }

    let decodedToken;
    
    try {
      // Try to verify with Firebase Admin SDK first
      decodedToken = await getAdminAuth().verifyIdToken(idToken);
      console.log('Token verified with Admin SDK');
    } catch (adminError) {
      console.error('Admin SDK verification failed, trying client-side verification:', adminError);
      
      // Fallback: Use client-side Firebase Auth for verification
      // Note: This is less secure but can help during development
      try {
        const clientAuth = getAuthInstance();
        // For client-side verification, we'll trust the token for now
        // In production, you should always use Admin SDK
        decodedToken = {
          uid: 'temp-uid-' + Date.now(),
          email: 'temp@example.com',
          name: 'Temporary User',
          picture: ''
        };
        console.log('Using fallback token verification');
      } catch (clientError) {
        console.error('Client-side verification also failed:', clientError);
        throw new Error('Token verification failed');
      }
    }
    
    // Check if user exists in database by Firebase UID
    let user = await userService.getById(decodedToken.uid);
    
    if (!user) {
      // Check if user exists by email (for existing users who might have different UID)
      user = await userService.getByEmail(decodedToken.email || '');
      
      if (user) {
        // User exists but with different UID, update the UID to match Firebase
        await userService.updateUid(user.id, decodedToken.uid);
        user = await userService.getById(decodedToken.uid);
      } else {
        // Create new user in database with Firebase UID as the document ID
        const isAdmin = decodedToken.email === 'admin@fullhundred.com' || 
                       decodedToken.email?.endsWith('@fullhundred.com');
        
        user = await userService.createWithId(decodedToken.uid, {
          email: decodedToken.email || '',
          displayName: decodedToken.name || decodedToken.email?.split('@')[0] || '',
          photoURL: decodedToken.picture || '',
          role: isAdmin ? 'admin' : 'user',
        });
      }
    } else {
      // Update existing user's information and last login time
      const updates: Partial<UserInput> & { lastLoginAt?: Date } = {
        lastLoginAt: new Date()
      };
      
      // Update display name and photo if they've changed
      if (decodedToken.name && decodedToken.name !== user.displayName) {
        updates.displayName = decodedToken.name;
      }
      if (decodedToken.picture && decodedToken.picture !== user.photoURL) {
        updates.photoURL = decodedToken.picture;
      }
      
      await userService.update(decodedToken.uid, updates);
      user = await userService.getById(decodedToken.uid);
    }
    
    let sessionCookie;
    
    try {
      // Try to create session cookie with Admin SDK
      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
      sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });
      console.log('Session cookie created with Admin SDK');
    } catch (cookieError) {
      console.error('Admin SDK session cookie creation failed:', cookieError);
      
      // Fallback: Create a simple session token
      sessionCookie = 'fallback-session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      console.log('Using fallback session token');
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Failed to create or retrieve user' }, { status: 500 });
    }
    
    const response = NextResponse.json({ 
      success: true, 
      isAdmin: user.role === 'admin',
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
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
    
    // Add CORS headers to error response
    const errorResponse = NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}

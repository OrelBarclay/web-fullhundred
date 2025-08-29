import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { userService, type UserInput } from '@/server/db';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ error: 'ID token required' }, { status: 400 });
    }

    // Verify the Firebase ID token
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    
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
    
    // Create a session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });
    
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
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    console.log('Session cookie set:', {
      name: 'auth-token',
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}

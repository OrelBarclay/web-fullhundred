import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { userService } from '@/server/db';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ error: 'ID token required' }, { status: 400 });
    }

    // Verify the Firebase ID token
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    
    // Check if user exists in database
    let user = await userService.getById(decodedToken.uid);
    
    if (!user) {
      // Create new user in database with Firebase UID as the document ID
      const isAdmin = decodedToken.email === 'admin@fullhundred.com' || 
                     decodedToken.email?.endsWith('@fullhundred.com');
      
      user = await userService.createWithId(decodedToken.uid, {
        email: decodedToken.email || '',
        displayName: decodedToken.name || decodedToken.email?.split('@')[0] || '',
        photoURL: decodedToken.picture || '',
        role: isAdmin ? 'admin' : 'user',
      });
    } else {
      // Update last login time
      await userService.updateLastLogin(decodedToken.uid);
    }
    
    // Create a session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });
    
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
    
    // Set the session cookie
    response.cookies.set('auth-token', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}

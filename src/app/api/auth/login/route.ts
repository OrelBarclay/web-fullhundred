import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ error: 'ID token required' }, { status: 400 });
    }

    // Verify the Firebase ID token
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    
    // Create a session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });
    
    // Check if user is admin (you can customize this logic)
    const isAdmin = decodedToken.email === 'admin@fullhundred.com' || 
                   decodedToken.email?.endsWith('@fullhundred.com');
    
    const response = NextResponse.json({ 
      success: true, 
      isAdmin,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
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

import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseApp } from '@/lib/firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const authToken = request.cookies.get('auth-token')?.value || request.cookies.get('auth-token-debug')?.value;
    
    if (!authToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // For now, we'll use a simple approach to get user info
    // In a real implementation, you'd verify the token and get user data from it
    
    // Check if the session token contains admin status
    const isAdmin = authToken.includes('-admin');
    
    // Extract user info from token (this is a simplified approach)
    // In production, you'd decode the token properly
    const userInfo = {
      isAdmin,
      role: isAdmin ? 'admin' : 'user'
    };
    
    return NextResponse.json(userInfo);
  } catch (error) {
    console.error('Error getting user info:', error);
    return NextResponse.json({ error: 'Failed to get user info' }, { status: 500 });
  }
}

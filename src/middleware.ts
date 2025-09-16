
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get auth token (try both versions)
  const authToken = request.cookies.get('auth-token') || request.cookies.get('auth-token-debug');
  const tokenValue = authToken?.value?.trim();
  
  // Check if token exists and is not empty
  const hasToken = tokenValue && tokenValue !== '';
  
  // Validate custom session token format: session-{timestamp}-{random}-{role}
  const isValidSessionToken = hasToken && 
    tokenValue.startsWith('session-') && 
    tokenValue.split('-').length >= 3 &&
    tokenValue.length > 20; // Reasonable minimum length for session token
  
  const hasValidToken = isValidSessionToken;
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!hasValidToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!hasValidToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check if user is admin and redirect to admin dashboard
    // Check if the session token contains 'admin' (set by login API)
    const isAdmin = authToken?.value?.includes('-admin') || false;
    
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }
  
  // Protect profile routes
  if (pathname.startsWith('/profile')) {
    if (!hasValidToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect cart routes
  if (pathname.startsWith('/cart')) {
    if (!hasValidToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  // Protect visualizer routes
  if (pathname.startsWith('/visualizer')) {
    if (!hasValidToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*', 
    '/dashboard/:path*', 
    '/profile/:path*', 
    '/cart',
    '/cart/:path*',
    '/visualizer/:path*',
  ]
};

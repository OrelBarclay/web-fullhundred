
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('=== MIDDLEWARE TRIGGERED ===');
  console.log('Path:', pathname);
  console.log('Method:', request.method);
  console.log('URL:', request.url);
  
  // Debug: Log all cookies
  const allCookies = request.cookies.getAll();
  console.log('Middleware - All cookies:', allCookies.map(c => ({ name: c.name, value: c.value ? 'present' : 'missing' })));
  
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
  
  console.log('Middleware - Auth token present:', hasToken);
  console.log('Middleware - Token value:', tokenValue?.substring(0, 20) + '...');
  console.log('Middleware - Is valid session token:', isValidSessionToken);
  console.log('Middleware - Has valid token:', hasValidToken);
  console.log('Middleware - Auth token source:', request.cookies.get('auth-token')?.value ? 'httpOnly' : 'debug');
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!hasValidToken) {
      console.log('Middleware - Redirecting to login (admin route)');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!hasValidToken) {
      console.log('Middleware - Redirecting to login (dashboard route)');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check if user is admin and redirect to admin dashboard
    // Check if the session token contains 'admin' (set by login API)
    const isAdmin = authToken?.value?.includes('-admin') || false;
    
    if (isAdmin) {
      console.log('Middleware - User is admin, redirecting to admin dashboard');
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }
  
  // Protect profile routes
  if (pathname.startsWith('/profile')) {
    if (!hasValidToken) {
      console.log('Middleware - Redirecting to login (profile route)');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect cart routes
  if (pathname.startsWith('/cart')) {
    console.log('Middleware - Cart route detected, checking auth...');
    console.log('Middleware - Auth token value:', authToken?.value ? 'present' : 'missing');
    console.log('Middleware - Has valid token:', hasValidToken);
    if (!hasValidToken) {
      console.log('Middleware - No valid auth token found, redirecting to login (cart route)');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    console.log('Middleware - Valid auth token found, allowing cart access');
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*', 
    '/dashboard/:path*', 
    '/profile/:path*', 
    '/cart',
    '/cart/:path*'
  ]
};


import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('Middleware triggered for path:', pathname);
  
  // Debug: Log all cookies
  const allCookies = request.cookies.getAll();
  console.log('Middleware - All cookies:', allCookies.map(c => ({ name: c.name, value: c.value ? 'present' : 'missing' })));
  
  // Get auth token (try both versions)
  const authToken = request.cookies.get('auth-token') || request.cookies.get('auth-token-debug');
  console.log('Middleware - Auth token present:', !!authToken?.value);
  console.log('Middleware - Auth token source:', request.cookies.get('auth-token') ? 'httpOnly' : 'debug');
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!authToken?.value) {
      console.log('Middleware - Redirecting to login (admin route)');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!authToken?.value) {
      console.log('Middleware - Redirecting to login (dashboard route)');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check if user is admin and redirect to admin dashboard
    // Check if the session token contains 'admin' (set by login API)
    const isAdmin = authToken.value.includes('-admin');
    
    if (isAdmin) {
      console.log('Middleware - User is admin, redirecting to admin dashboard');
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }
  
  // Protect profile routes
  if (pathname.startsWith('/profile')) {
    if (!authToken?.value) {
      console.log('Middleware - Redirecting to login (profile route)');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect cart routes
  if (pathname.startsWith('/cart')) {
    console.log('Middleware - Cart route detected, checking auth...');
    if (!authToken?.value) {
      console.log('Middleware - No auth token found, redirecting to login (cart route)');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    console.log('Middleware - Auth token found, allowing cart access');
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

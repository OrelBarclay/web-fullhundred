import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Debug: Log all cookies
  const allCookies = request.cookies.getAll();
  console.log('Middleware - All cookies:', allCookies.map(c => ({ name: c.name, value: c.value ? 'present' : 'missing' })));
  
  // Get auth token
  const authToken = request.cookies.get('auth-token');
  console.log('Middleware - Auth token present:', !!authToken?.value);
  
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
  }
  
  // Protect profile routes
  if (pathname.startsWith('/profile')) {
    if (!authToken?.value) {
      console.log('Middleware - Redirecting to login (profile route)');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/profile/:path*']
};

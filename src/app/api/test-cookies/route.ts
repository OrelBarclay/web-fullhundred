import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get all cookies from the request
  const allCookies = request.cookies.getAll();
  
  // Check for auth-token specifically
  const authToken = request.cookies.get('auth-token');
  
  return NextResponse.json({
    success: true,
    allCookies: allCookies.map(c => ({
      name: c.name,
      value: c.value ? 'present' : 'missing',
      hasValue: !!c.value
    })),
    authTokenPresent: !!authToken?.value,
    authTokenValue: authToken?.value ? 'present' : 'missing',
    headers: Object.fromEntries(request.headers.entries()),
    url: request.url
  });
}

export async function POST(request: NextRequest) {
  try {
    const { testValue } = await request.json();
    
    // Set a test cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'Test cookie set',
      testValue 
    });
    
    response.cookies.set('test-cookie', testValue || 'test-value', {
      maxAge: 60 * 60 * 24 * 1 * 1000, // 1 day
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to set test cookie' 
    }, { status: 500 });
  }
}

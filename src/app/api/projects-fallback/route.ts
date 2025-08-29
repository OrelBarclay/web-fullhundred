import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // This is a temporary fallback API route
    // In production, fix the Firebase Admin service account permissions
    
    // For now, return empty array to prevent errors
    // You can implement actual client-side Firebase logic here if needed
    
    console.log('projects-fallback: Returning empty projects array as fallback');
    return NextResponse.json([]);
    
  } catch (error) {
    console.error('projects-fallback: Error:', error);
    return NextResponse.json({ error: 'Fallback failed' }, { status: 500 });
  }
}

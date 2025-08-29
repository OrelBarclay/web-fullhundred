import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/server/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Simple session verification - check if auth-token cookie exists
    const authToken = request.cookies.get('auth-token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, we'll trust the cookie and just check if the user exists
    // TODO: Implement proper session verification when Firebase Admin is fixed
    const user = await userService.getById(id);
    if (!user) {
      console.log('User not found for ID:', id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User found:', { id: user.id, email: user.email });
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Simple session verification - check if auth-token cookie exists
    const authToken = request.cookies.get('auth-token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, phone, address } = body;

    console.log('Updating user profile:', { id, displayName, phone, address });

    // Update user profile
    await userService.update(id, {
      displayName,
      phone,
      address
    });

    // Get updated user
    const updatedUser = await userService.getById(id);
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User profile updated successfully');
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

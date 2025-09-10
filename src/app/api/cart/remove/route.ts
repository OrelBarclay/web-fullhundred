import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId, itemId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const db = getDb();
    const cartRef = doc(db, 'carts', userId);
    const cartDoc = await getDoc(cartRef);
    
    if (!cartDoc.exists()) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    const cartData = cartDoc.data();
    const currentItems = cartData.items || [];
    
    // Remove item from cart
    const updatedItems = currentItems.filter((item: { id: string }) => item.id !== itemId);

    // Save updated cart
    await setDoc(cartRef, {
      items: updatedItems,
      updatedAt: new Date(),
      userId
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Item removed from cart successfully',
      items: updatedItems,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    return NextResponse.json({ error: 'Failed to remove item from cart' }, { status: 500 });
  }
}

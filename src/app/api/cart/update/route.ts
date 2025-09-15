import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId, itemId, quantity } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    if (quantity < 0) {
      return NextResponse.json({ error: 'Quantity must be non-negative' }, { status: 400 });
    }

    const db = getDb();
    const cartRef = doc(db, 'carts', userId);
    const cartDoc = await getDoc(cartRef);
    
    if (!cartDoc.exists()) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    const cartData = cartDoc.data();
    const currentItems = cartData.items || [];
    
    // Update item quantity
    const updatedItems = currentItems.map((item: { id: string; quantity: number }) => 
      item.id === itemId ? { ...item, quantity } : item
    ).filter((item: { quantity: number }) => item.quantity > 0); // Remove items with 0 quantity

    // Save updated cart
    await setDoc(cartRef, {
      items: updatedItems,
      updatedAt: new Date(),
      userId
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Item quantity updated successfully',
      items: updatedItems,
      updatedAt: new Date()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update item quantity' }, { status: 500 });
  }
}

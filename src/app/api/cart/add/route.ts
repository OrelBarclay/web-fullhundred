import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId, item, quantity = 1 } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (!item || !item.id) {
      return NextResponse.json({ error: 'Valid item required' }, { status: 400 });
    }

    const db = getDb();
    const cartRef = doc(db, 'carts', userId);
    const cartDoc = await getDoc(cartRef);
    
    let currentItems = [];
    if (cartDoc.exists()) {
      const cartData = cartDoc.data();
      currentItems = cartData.items || [];
    }

    // Check if item already exists
    const existingItemIndex = currentItems.findIndex((existingItem: { id: string }) => existingItem.id === item.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      currentItems[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      currentItems.push({ ...item, quantity });
    }

    // Save updated cart
    await setDoc(cartRef, {
      items: currentItems,
      updatedAt: new Date(),
      userId
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Item added to cart successfully',
      items: currentItems,
      updatedAt: new Date()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
  }
}

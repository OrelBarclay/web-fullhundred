import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const db = getDb();
    const cartRef = doc(db, 'carts', userId);
    const cartDoc = await getDoc(cartRef);
    
    if (cartDoc.exists()) {
      const cartData = cartDoc.data();
      return NextResponse.json({ 
        items: cartData.items || [],
        updatedAt: cartData.updatedAt,
        userId: cartData.userId
      });
    } else {
      return NextResponse.json({ items: [], updatedAt: null, userId });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, items } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items must be an array' }, { status: 400 });
    }

    const db = getDb();
    const cartRef = doc(db, 'carts', userId);
    
    await setDoc(cartRef, {
      items,
      updatedAt: new Date(),
      userId
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Cart updated successfully',
      items,
      updatedAt: new Date()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const db = getDb();
    const cartRef = doc(db, 'carts', userId);
    await deleteDoc(cartRef);

    return NextResponse.json({ 
      success: true, 
      message: 'Cart cleared successfully' 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
  }
}

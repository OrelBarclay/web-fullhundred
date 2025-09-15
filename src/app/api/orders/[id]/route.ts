import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }
    
    const db = getDb();
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);

    
    if (!orderDoc.exists()) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const orderData = {
      id: orderDoc.id,
      ...orderDoc.data()
    };
    
    return NextResponse.json({ order: orderData });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

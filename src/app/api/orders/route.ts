import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const status = searchParams.get('status');
    
    const db = getDb();
    const ordersRef = collection(db, 'orders');
    
    let q = query(ordersRef, orderBy('createdAt', 'desc'));
    
    if (status) {
      q = query(ordersRef, where('status', '==', status), orderBy('createdAt', 'desc'));
    }
    
    if (limitParam) {
      const limitNum = parseInt(limitParam, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        q = query(q, limit(limitNum));
      }
    }
    
    const ordersSnapshot = await getDocs(q);
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({ 
      orders,
      total: orders.length 
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

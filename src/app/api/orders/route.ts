import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, where, type Query, type DocumentData, type CollectionReference } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const status = searchParams.get('status');
    const email = searchParams.get('email');
    
    const db = getDb();
    const ordersRef = collection(db, 'orders');
    
    // Prefer indexed query, but gracefully fallback if index is missing
    let orders: Array<Record<string, unknown>> = [];
    const limitNum = limitParam ? parseInt(limitParam, 10) : undefined;

    try {
      let q = query(ordersRef, orderBy('createdAt', 'desc'));
      if (status) q = query(ordersRef, where('status', '==', status), orderBy('createdAt', 'desc'));
      if (email) q = query(ordersRef, where('customerEmail', '==', email), orderBy('createdAt', 'desc'));
      if (limitNum && !isNaN(limitNum) && limitNum > 0) q = query(q, limit(limitNum));

      const ordersSnapshot = await getDocs(q);
      orders = ordersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (_indexedErr) {
      // Fallback: remove orderBy to avoid composite index requirement, then sort in-memory
      let q2: Query<DocumentData> | CollectionReference<DocumentData> = ordersRef;
      const constraints: Array<ReturnType<typeof where>> = [];
      if (status) constraints.push(where('status', '==', status));
      if (email) constraints.push(where('customerEmail', '==', email));
      if (constraints.length > 0) {
        q2 = query(ordersRef, ...constraints);
      }

      const ordersSnapshot = await getDocs(q2);

      const toDateSafe = (v: unknown): Date => {
        if (v && typeof v === 'object' && 'toDate' in (v as Record<string, unknown>)) {
          const maybeFn = (v as { toDate?: unknown }).toDate;
          if (typeof maybeFn === 'function') {
            return (maybeFn as () => Date)();
          }
        }
        if (typeof v === 'string' || typeof v === 'number') return new Date(v);
        return new Date(0);
      };

      const raw = ordersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      raw.sort((a, b) => {
        const ad = toDateSafe((a as Record<string, unknown>).createdAt).getTime();
        const bd = toDateSafe((b as Record<string, unknown>).createdAt).getTime();
        return bd - ad;
      });
      orders = limitNum && !isNaN(limitNum) && limitNum > 0 ? raw.slice(0, limitNum) : raw;
    }
    
    return NextResponse.json({ 
      orders,
      total: orders.length 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

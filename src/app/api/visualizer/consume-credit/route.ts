import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const db = getDb();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const currentCredits = userData?.visualizerCredits || 0;

    if (currentCredits <= 0) {
      return NextResponse.json({ 
        error: 'No credits remaining', 
        credits: 0,
        needsPayment: true 
      }, { status: 400 });
    }

    // Consume one credit
    const newCredits = Math.max(0, currentCredits - 1);
    
    await updateDoc(userRef, {
      visualizerCredits: newCredits,
      updatedAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      credits: newCredits,
      remaining: newCredits > 0
    });
  } catch (error) {
    console.error('Error consuming visualizer credit:', error);
    return NextResponse.json({ error: 'Failed to consume credit' }, { status: 500 });
  }
}

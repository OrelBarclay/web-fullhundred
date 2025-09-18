import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const db = getDb();
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return NextResponse.json({ credits: 0, totalCredits: 0 });
    }

    const userData = userDoc.data();
    const credits = userData?.visualizerCredits || 0;
    const totalCredits = userData?.totalVisualizerCredits || 0;

    return NextResponse.json({ 
      credits: Number(credits), 
      totalCredits: Number(totalCredits),
      hasCredits: Number(credits) > 0
    });
  } catch (error) {
    console.error('Error fetching visualizer credits:', error);
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, credits } = await req.json();

    if (!userId || typeof credits !== 'number') {
      return NextResponse.json({ error: 'User ID and credits required' }, { status: 400 });
    }

    const db = getDb();
    const userRef = doc(db, 'users', userId);
    
    // Add credits to user account
    await updateDoc(userRef, {
      visualizerCredits: credits,
      totalVisualizerCredits: credits,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, credits });
  } catch (error) {
    console.error('Error updating visualizer credits:', error);
    return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
  }
}

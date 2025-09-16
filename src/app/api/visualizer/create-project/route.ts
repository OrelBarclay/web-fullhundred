import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getAuthInstance } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const { beforeImageUrl, resultImageUrl, styleId, styleLabel } = await req.json();
    if (!resultImageUrl) {
      return NextResponse.json({ error: 'Missing result image' }, { status: 400 });
    }

    // We rely on frontend to gate admin usage; here we just create the project
    const db = getDb();
    const projectId = `viz-${Date.now()}`;
    await setDoc(doc(db, 'projects', projectId), {
      id: projectId,
      title: `Visualizer Project - ${styleLabel || styleId || 'Design'}`,
      description: 'Project created from AI Visualizer (admin)'.trim(),
      status: 'planning',
      startDate: new Date(),
      budget: 0,
      beforeImages: beforeImageUrl ? [beforeImageUrl] : [],
      afterImages: [resultImageUrl],
      projectType: 'visualizer',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPortfolioProject: false,
    }, { merge: true });

    return NextResponse.json({ projectId });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}



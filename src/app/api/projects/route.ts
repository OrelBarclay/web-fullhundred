import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, getDocs, limit as fbLimit, orderBy, query, where, Query } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || '';
    const limitParam = searchParams.get('limit');

    const db = getDb();
    const projectsRef = collection(db, 'projects');

    // Helper to build a query with optional limit
    const withLimit = (qBase: Query) => {
      const n = limitParam ? parseInt(limitParam, 10) : NaN;
      return !isNaN(n) && n > 0 ? query(qBase, fbLimit(n)) : qBase;
    };

    const resultsMap = new Map<string, Record<string, unknown>>();

    if (email) {
      // Query by clientId
      const q1 = withLimit(query(projectsRef, where('clientId', '==', email), orderBy('startDate', 'desc')));
      const s1 = await getDocs(q1);
      s1.docs.forEach((d) => resultsMap.set(d.id, { id: d.id, ...d.data() as Record<string, unknown> }));

      // Query by clientEmail
      const q2 = withLimit(query(projectsRef, where('clientEmail', '==', email), orderBy('startDate', 'desc')));
      const s2 = await getDocs(q2);
      s2.docs.forEach((d) => resultsMap.set(d.id, { id: d.id, ...d.data() as Record<string, unknown> }));

      // Query by customerEmail
      const q3 = withLimit(query(projectsRef, where('customerEmail', '==', email), orderBy('startDate', 'desc')));
      const s3 = await getDocs(q3);
      s3.docs.forEach((d) => resultsMap.set(d.id, { id: d.id, ...d.data() as Record<string, unknown> }));
    } else {
      // No email provided; return a small recent set to avoid large scans
      const qAll = withLimit(query(projectsRef, orderBy('startDate', 'desc')));
      const sAll = await getDocs(qAll);
      sAll.docs.forEach((d) => resultsMap.set(d.id, { id: d.id, ...d.data() as Record<string, unknown> }));
    }

    // Convert map to array and optionally sort by startDate desc
    const toDateSafe = (value: unknown): Date => {
      // Firestore Timestamp has toDate function
      if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate();
      }
      if (typeof value === 'string' || typeof value === 'number') return new Date(value);
      return new Date(0);
    };

    const projects = Array.from(resultsMap.values()).sort((a, b) => {
      const aStart = (a as Record<string, unknown>)['startDate'];
      const bStart = (b as Record<string, unknown>)['startDate'];
      const aDate = toDateSafe(aStart);
      const bDate = toDateSafe(bStart);
      return bDate.getTime() - aDate.getTime();
    });

    return NextResponse.json({ projects, total: projects.length });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

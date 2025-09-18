import { NextResponse } from 'next/server';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getFirebaseApp } from '@/lib/firebase';

export async function GET() {
  try {
    console.log('projects-fallback: Starting to fetch projects using client-side Firebase...');
    
    // Use client-side Firebase to read from the database
    const app = getFirebaseApp();
    const db = getFirestore(app);
    
    // Read from the projects collection
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<Record<string, unknown>>;
    
    // Sort by order field (ascending), then by startDate (descending) as fallback
    const sortedProjects = projects.sort((a, b) => {
      const aOrder = (a.order as number) || 0;
      const bOrder = (b.order as number) || 0;
      
      // If both have order, sort by order
      if (aOrder !== 0 && bOrder !== 0) {
        return aOrder - bOrder;
      }
      
      // If only one has order, prioritize it
      if (aOrder !== 0 && bOrder === 0) return -1;
      if (aOrder === 0 && bOrder !== 0) return 1;
      
      // If neither has order, sort by startDate descending
      const aStart = a.startDate ? new Date(a.startDate as string | number | Date).getTime() : 0;
      const bStart = b.startDate ? new Date(b.startDate as string | number | Date).getTime() : 0;
      return bStart - aStart;
    });
    
    console.log('projects-fallback: Successfully fetched and sorted projects:', sortedProjects.length);
    return NextResponse.json(sortedProjects);
    
  } catch (error) {
    console.error('projects-fallback: Error:', error);
    
    // If client-side Firebase also fails, return empty array
    console.log('projects-fallback: Returning empty array due to error');
    return NextResponse.json([]);
  }
}

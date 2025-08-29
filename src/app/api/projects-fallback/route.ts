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
    }));
    
    console.log('projects-fallback: Successfully fetched projects:', projects.length);
    return NextResponse.json(projects);
    
  } catch (error) {
    console.error('projects-fallback: Error:', error);
    
    // If client-side Firebase also fails, return empty array
    console.log('projects-fallback: Returning empty array due to error');
    return NextResponse.json([]);
  }
}

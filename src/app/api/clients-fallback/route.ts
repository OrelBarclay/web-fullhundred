import { NextResponse } from 'next/server';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getFirebaseApp } from '@/lib/firebase';

export async function GET() {
  try {
    console.log('clients-fallback: Starting to fetch clients using client-side Firebase...');
    
    // Use client-side Firebase to read from the database
    const app = getFirebaseApp();
    const db = getFirestore(app);
    
    // Read from the clients collection
    const clientsSnapshot = await getDocs(collection(db, 'clients'));
    const clients = clientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('clients-fallback: Successfully fetched clients:', clients.length);
    return NextResponse.json(clients);
    
  } catch (error) {
    console.error('clients-fallback: Error:', error);
    
    // If client-side Firebase also fails, return empty array
    console.log('clients-fallback: Returning empty array due to error');
    return NextResponse.json([]);
  }
}

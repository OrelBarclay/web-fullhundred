import { NextResponse } from "next/server";
import { getFirebaseApp } from "@/lib/firebase";
import { getFirestore, collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    const app = getFirebaseApp();
    const db = getFirestore(app);
    
    const mediaSnapshot = await getDocs(collection(db, "media"));
    const media = mediaSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(media);
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

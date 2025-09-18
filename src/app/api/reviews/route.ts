import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";

export async function GET() {
  try {
    const db = getDb();
    const ref = collection(db, "reviews");
    const q = query(ref, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, text, rating, photoUrl } = body || {};
    if (!name || !text || !rating) {
      return NextResponse.json({ error: "name, text, and rating are required" }, { status: 400 });
    }
    const db = getDb();
    const ref = collection(db, "reviews");
    const docRef = await addDoc(ref, {
      name: String(name).trim(),
      text: String(text).trim(),
      rating: Math.max(1, Math.min(5, Number(rating))),
      photoUrl: photoUrl ? String(photoUrl) : null,
      createdAt: serverTimestamp(),
    });
    return NextResponse.json({ id: docRef.id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}

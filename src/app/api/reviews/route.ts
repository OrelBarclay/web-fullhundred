import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp, doc, getDoc } from "firebase/firestore";

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
    const { name, text, rating, photoUrl, projectId, customerEmail } = body || {};
    if (!name || !text || !rating || !projectId) {
      return NextResponse.json({ error: "name, text, rating and projectId are required" }, { status: 400 });
    }

    const db = getDb();

    // Gate: project must exist and be completed; requester must match customer email or clientId
    const pRef = doc(db, "projects", String(projectId));
    const pSnap = await getDoc(pRef);
    if (!pSnap.exists()) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const pdata = pSnap.data() as Record<string, unknown>;
    const status = String((pdata as { status?: unknown }).status ?? "").toLowerCase();
    if (status !== "completed") {
      return NextResponse.json({ error: "Reviews are only allowed for completed projects" }, { status: 403 });
    }
    const custEmail = String((pdata as { customerEmail?: unknown }).customerEmail ?? (pdata as { clientEmail?: unknown }).clientEmail ?? (pdata as { clientId?: unknown }).clientId ?? "").toLowerCase();
    if (customerEmail && String(customerEmail).toLowerCase() !== custEmail) {
      return NextResponse.json({ error: "Not authorized to review this project" }, { status: 403 });
    }

    const ref = collection(db, "reviews");
    const docRef = await addDoc(ref, {
      name: String(name).trim(),
      text: String(text).trim(),
      rating: Math.max(1, Math.min(5, Number(rating))),
      photoUrl: photoUrl ? String(photoUrl) : null,
      projectId: String(projectId),
      customerEmail: custEmail || null,
      createdAt: serverTimestamp(),
    });
    return NextResponse.json({ id: docRef.id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}

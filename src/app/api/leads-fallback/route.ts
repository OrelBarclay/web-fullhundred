import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.email || body.email.trim().length === 0) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!body.projectType || body.projectType.trim().length === 0) {
      return NextResponse.json({ error: "Project type is required" }, { status: 400 });
    }
    if (!body.projectDetails || body.projectDetails.trim().length === 0) {
      return NextResponse.json({ error: "Project details are required" }, { status: 400 });
    }

    const db = getDb();
    const now = new Date();
    
    const leadData = {
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || undefined,
      projectType: body.projectType.trim(),
      description: body.projectDetails.trim(),
      budget: body.budget,
      timeline: body.timeline,
      // Additional quote-specific fields
      projectSize: body.projectSize,
      customQuote: body.customQuote || false,
      estimate: body.estimate,
      timestamp: body.timestamp,
      createdAt: now
    };

    const docRef = await addDoc(collection(db, 'leads'), leadData);

    return NextResponse.json({ 
      id: docRef.id, 
      ...leadData 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}

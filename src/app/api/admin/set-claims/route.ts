import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { uid, claims } = await request.json();
    
    if (!uid || !claims) {
      return NextResponse.json({ error: "UID and claims are required" }, { status: 400 });
    }

    // Get Firebase Admin Auth instance
    const adminAuth = getAdminAuth();
    
    // Set custom claims for the user
    await adminAuth.setCustomUserClaims(uid, claims);
    
    return NextResponse.json({ 
      success: true, 
      message: "Custom claims updated successfully" 
    });
  } catch (error) {
    console.error("Error setting custom claims:", error);
    return NextResponse.json({ 
      error: "Failed to set custom claims" 
    }, { status: 500 });
  }
}

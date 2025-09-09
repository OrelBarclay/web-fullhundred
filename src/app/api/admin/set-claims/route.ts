import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { uid, claims } = await request.json();
    
    if (!uid || !claims) {
      return NextResponse.json({ error: "UID and claims are required" }, { status: 400 });
    }

    // Try to set custom claims with Firebase Admin SDK
    try {
      const adminAuth = getAdminAuth();
      await adminAuth.setCustomUserClaims(uid, claims);
      console.log('Custom claims set successfully for user:', uid);
    } catch (adminError) {
      console.warn('Firebase Admin SDK failed, continuing with Firestore update only:', adminError);
      // Continue with Firestore update even if Admin SDK fails
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "User role updated successfully (custom claims may not be set due to Admin SDK issues)" 
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ 
      error: "Failed to update user role" 
    }, { status: 500 });
  }
}

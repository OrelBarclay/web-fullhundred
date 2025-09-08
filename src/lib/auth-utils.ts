import { getAuthInstance } from "@/lib/firebase";
import { getIdTokenResult } from "firebase/auth";

export interface CustomClaims {
  admin?: boolean;
  role?: string;
}

export async function getUserCustomClaims(): Promise<CustomClaims | null> {
  try {
    const auth = getAuthInstance();
    const user = auth.currentUser;
    
    if (!user) {
      return null;
    }

    // Force refresh the ID token to get the latest custom claims
    const idTokenResult = await getIdTokenResult(user, true);
    
    // Custom claims are included in the ID token result
    return idTokenResult.claims as CustomClaims;
  } catch (error) {
    console.error("Error getting custom claims:", error);
    return null;
  }
}

export async function isUserAdmin(): Promise<boolean> {
  try {
    const claims = await getUserCustomClaims();
    return claims?.admin === true || claims?.role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export async function getUserRole(): Promise<string | null> {
  try {
    const claims = await getUserCustomClaims();
    return claims?.role || null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}

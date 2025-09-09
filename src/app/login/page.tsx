"use client";
import { useState, useEffect, useCallback } from "react";
import { getAuthInstance, signInWithPopup, GoogleAuthProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isUserAdmin } from "@/lib/auth-utils";
import type { User } from "firebase/auth";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const checkUserRoleAndRedirect = useCallback(async (user: User) => {
    try {
      const idToken = await user.getIdToken();
      console.log('Login: Got ID token, calling login API...');
      
      // Prepare user data to send to the API
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, user: userData }),
      });

      console.log('Login: API response status:', response.status);
      console.log('Login: API response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Login: API response data:', data);
        
        // Check if cookie was set
        const cookies = document.cookie;
        console.log('Login: Current cookies:', cookies);
        
        // Wait a moment for the cookie to be set
        console.log('Login: Waiting for cookie to be set...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check cookies again
        const cookiesAfterDelay = document.cookie;
        console.log('Login: Cookies after delay:', cookiesAfterDelay);
        
        // Check if user is admin using custom claims
        const isAdmin = await isUserAdmin();
        console.log('Login: User admin status:', isAdmin);
        
        if (isAdmin) {
          console.log('Login: Redirecting to admin dashboard...');
          router.push("/admin");
        } else {
          console.log('Login: Redirecting to user dashboard...');
          router.push("/dashboard");
        }
      } else {
        console.error('Login: API response not ok:', response.status);
        const errorData = await response.text();
        console.error('Login: Error response:', errorData);
      }
    } catch (err) {
      console.error("Error checking user role:", err);
    }
  }, [router]);

  useEffect(() => {
    // Check if already logged in
    const auth = getAuthInstance();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in, redirect based on role
        checkUserRoleAndRedirect(user);
      }
    });

    return () => unsubscribe();
  }, [checkUserRoleAndRedirect]);

  async function handleGoogleSignIn() {
    try {
      setIsLoading(true);
      setError(null);
      
      const auth = getAuthInstance();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      
      // The user is now signed in, checkUserRoleAndRedirect will handle the redirect
    } catch (err: unknown) {
      console.error("Google sign-in error:", err);
      const errorMessage = err instanceof Error ? err.message : "Sign-in failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your dashboard or admin panel
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? (
              "Signing in..."
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
          
          <div className="text-center">
            <Link href="/" className="text-blue-600 hover:text-blue-500">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

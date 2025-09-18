"use client";
import { useState, useEffect, useCallback } from "react";
import { getAuthInstance, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, TwitterAuthProvider, GithubAuthProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
        
        // Check if user is admin from API response
        const { isAdmin } = data;
        console.log('Login: User admin status from API:', isAdmin);
        
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

  async function handleSocialSignIn(provider: GoogleAuthProvider | FacebookAuthProvider | TwitterAuthProvider | GithubAuthProvider, providerName: string) {
    try {
      setIsLoading(true);
      setError(null);
      
      const auth = getAuthInstance();
      await signInWithPopup(auth, provider);
      
      // The user is now signed in, checkUserRoleAndRedirect will handle the redirect
    } catch (err: unknown) {
      console.error(`${providerName} sign-in error:`, err);
      const errorMessage = err instanceof Error ? err.message : "Sign-in failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();
    await handleSocialSignIn(provider, "Google");
  }

  async function handleFacebookSignIn() {
    const provider = new FacebookAuthProvider();
    await handleSocialSignIn(provider, "Facebook");
  }

  async function handleTwitterSignIn() {
    const provider = new TwitterAuthProvider();
    await handleSocialSignIn(provider, "Twitter");
  }

  async function handleGithubSignIn() {
    const provider = new GithubAuthProvider();
    await handleSocialSignIn(provider, "GitHub");
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            {/* <Logo /> */}
            <Image src="/images/logo-light.png" alt="Full100services Logo" width={160} height={64} />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Welcome Back
          </h1>
          <p className="text-[color:var(--muted-foreground)]">
            Sign in to access your Full100services dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[color:var(--card)] rounded-2xl shadow-xl border border-[color:var(--border)] p-8">
          {error && (
            <div className="mb-6 bg-[color:var(--muted)] border border-[color:var(--border)] text-[color:var(--foreground)] px-4 py-3 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="group relative w-full flex justify-center items-center py-4 px-6 border border-[color:var(--border)] text-sm font-semibold rounded-xl text-[color:var(--foreground)] bg-[color:var(--popover)] hover:bg-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-3"></div>
                  Signing in...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {/* Facebook Sign In */}
            <button
              onClick={handleFacebookSignIn}
              disabled={isLoading}
              className="group relative w-full flex justify-center items-center py-4 px-6 text-sm font-semibold rounded-xl text-white bg-[#1877F2] hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </button>

            {/* GitHub Sign In */}
            <button
              onClick={handleGithubSignIn}
              disabled={isLoading}
              className="group relative w-full flex justify-center items-center py-4 px-6 border border-[color:var(--border)] text-sm font-semibold rounded-xl text-[color:var(--foreground)] bg-[color:var(--popover)] hover:bg-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>

            {/* Twitter Sign In */}
            <button
              onClick={handleTwitterSignIn}
              disabled={isLoading}
              className="group relative w-full flex justify-center items-center py-4 px-6 text-sm font-semibold rounded-xl text-white bg-[#1DA1F2] hover:bg-[#1a91da] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Continue with Twitter
            </button>
          </div>
          
          {/* Divider */}
          <div className="mt-8 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[color:var(--border)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[color:var(--card)] text-[color:var(--muted-foreground)]">Secure & Fast</span>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-[color:var(--muted-foreground)]">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}

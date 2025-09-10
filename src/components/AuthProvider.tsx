"use client";
import { useEffect, useState } from "react";
import { getAuthInstance, signOut, getDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import type { User } from "firebase/auth";

export default function AuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        
        // Load user profile image
        try {
          const db = getDb();
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfileImage(userData.photoURL || user.photoURL || null);
          } else {
            setProfileImage(user.photoURL || null);
          }
        } catch (error) {
          console.error("Error loading profile image:", error);
          setProfileImage(user.photoURL || null);
        }
        
        // Check if user is admin
        try {
          const idToken = await user.getIdToken();
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
          if (response.ok) {
            const { isAdmin: adminStatus } = await response.json();
            setIsAdmin(adminStatus);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setProfileImage(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleLogout() {
    try {
      await signOut(getAuthInstance());
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  return (
    <>
      {!isLoading && (
        <>
          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Profile Image - Always visible */}
              <Link href="/profile" className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={user.displayName || user.email || 'Profile'}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center border border-gray-300 dark:border-gray-600">
                            <span class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                              ${(user.displayName || user.email || 'U')[0].toUpperCase()}
                            </span>
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center border border-gray-300 dark:border-gray-600">
                    <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                {/* User name - hidden on very small screens */}
                <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.displayName || user.email?.split('@')[0] || 'User'}
                </span>
              </Link>
              
              {/* Navigation Links - Responsive layout */}
              <div className="flex items-center gap-2 sm:gap-4">
                {isAdmin ? (
                  <Link href="/admin" className="hover:underline text-xs sm:text-sm px-1 sm:px-0">Admin</Link>
                ) : (
                  <Link href="/dashboard" className="hover:underline text-xs sm:text-sm px-1 sm:px-0">Dashboard</Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:underline text-xs sm:text-sm px-1 sm:px-0"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="hover:underline text-sm">Login</Link>
          )}
        </>
      )}
    </>
  );
}

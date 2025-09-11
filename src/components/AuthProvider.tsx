"use client";
import { useEffect, useState } from "react";
import { getAuthInstance, signOut } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import type { User } from "firebase/auth";
import Image from "next/image";

export default function AuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { clearLocal } = useCart();
  const router = useRouter();

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        
        
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
      // Clear only local state on logout; keep server cart intact
      clearLocal();
      router.push("/"); // Redirect to home page
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  return (
    <>
      {!isLoading && (
        <>
          {user ? (
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Profile Section */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Profile Image */}
                <Link href="/profile" className="group flex items-center gap-2 hover:opacity-80 transition-all duration-200">
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName?.split(' ')[0] || user.email || 'Profile'}
                        fill
                        className="rounded-full object-cover border-2 border-[color:var(--border)] group-hover:border-primary transition-colors"
                        onError={(e) => {
                          // Fallback to initials if image fails
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center border-2 border-[color:var(--border)] group-hover:border-primary transition-colors ${user.photoURL ? 'hidden' : 'flex'}`}
                    >
                      <span className="text-sm sm:text-base font-semibold text-primary">
                        {(user.displayName?.split(' ')[0] || user.email || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* User name */}
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium text-[color:var(--foreground)]">
                      {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-[color:var(--muted-foreground)]">
                      {isAdmin ? 'Administrator' : 'User'}
                    </div>
                  </div>
                </Link>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <Link 
                    href="/admin" 
                    className="px-3 py-1.5 text-xs sm:text-sm font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-md transition-colors"
                  >
                    Admin
                  </Link>
                ) : (
                  <Link 
                    href="/dashboard" 
                    className="px-3 py-1.5 text-xs sm:text-sm font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-md transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="hover:underline text-sm">Login</Link>
            </div>
          )}
        </>
      )}
    </>
  );
}

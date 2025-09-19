"use client";
import { useEffect, useState } from "react";
import { getAuthInstance, signOut } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import type { User } from "firebase/auth";
import Image from "next/image";
import { request } from "http";

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
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Separate useEffect to check admin status when user changes
  useEffect(() => {
    if (user) {
      // Check admin status from session token in cookies with retry
      const checkAdminStatus = () => {
        const getCookieValue = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };
        
        const authToken = getCookieValue('auth-token') || getCookieValue('auth-token-debug');
        const isAdmin = authToken?.includes('-admin') || false;
        setIsAdmin(isAdmin);
        
        // If no token found, retry after a short delay (cookies might be setting)
        if (!authToken) {
          setTimeout(checkAdminStatus, 500);
        }
      };
      
      checkAdminStatus();
    } else {
      setIsAdmin(false);
    }
  }, [user]);

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
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Profile Section - Compact on mobile */}
              <div className="flex items-center gap-2">
                {/* Profile Image */}
                <Link href="/profile" className="group flex items-center gap-2 hover:opacity-80 transition-all duration-200">
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName?.split(' ')[0] || user.email || 'Profile'}
                        fill
                        sizes="(min-width: 640px) 40px, 32px"
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
                  
                  {/* User name - Hidden on mobile, shown on desktop */}
                  <div className="hidden lg:block">
                    <div className="text-sm font-medium text-[color:var(--foreground)]">
                      {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-[color:var(--muted-foreground)]">
                      {isAdmin ? 'Administrator' : 'User'}
                    </div>
                  </div>
                </Link>
              </div>
              
              {/* Action Buttons - Hidden on mobile, shown on desktop */}
              <div className="hidden lg:flex items-center gap-2">
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

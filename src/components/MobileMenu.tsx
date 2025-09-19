"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import CartIcon from "@/components/CartIcon";
import { getAuthInstance } from "@/lib/firebase";
import type { User } from "firebase/auth";
import Image from "next/image";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Handle authentication state
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

  // Check admin status when user changes
  useEffect(() => {
    if (user) {
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
        
        if (!authToken) {
          setTimeout(checkAdminStatus, 500);
        }
      };
      
      checkAdminStatus();
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  return (
    <div className="lg:hidden relative" ref={menuRef}>
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu-panel"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-all duration-300 group"
      >
        {/* Animated background */}
        <div className={`absolute inset-0 rounded-lg bg-primary/10 transition-all duration-300 ${open ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
        
        {/* Icon container with smooth rotation */}
        <div className={`relative transition-transform duration-300 ${open ? 'rotate-90' : 'rotate-0'}`}>
          <svg
            className="h-6 w-6 transition-all duration-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {open ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" className="transition-all duration-300" />
                <line x1="3" y1="12" x2="21" y2="12" className="transition-all duration-300" />
                <line x1="3" y1="18" x2="21" y2="18" className="transition-all duration-300" />
              </>
            )}
          </svg>
        </div>
        
        {/* Notification dot for new items (optional) */}
        {user && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
        )}
      </button>

      {open && (
        <div
          id="mobile-menu-panel"
          className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-2xl backdrop-blur-md overflow-hidden z-50 animate-in slide-in-from-top-2 duration-300"
        >
          <div className="p-6 space-y-6">
            {/* User Profile Section (if logged in) */}
            {!isLoading && user && (
              <div className="flex items-center gap-3 pb-4 border-b border-[color:var(--border)]">
                <div className="relative w-12 h-12">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName?.split(' ')[0] || user.email || 'Profile'}
                      fill
                      sizes="48px"
                      className="rounded-full object-cover border-2 border-[color:var(--border)]"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center border-2 border-[color:var(--border)]">
                      <span className="text-lg font-semibold text-primary">
                        {(user.displayName?.split(' ')[0] || user.email || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-[color:var(--foreground)]">
                    {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-sm text-[color:var(--muted-foreground)]">
                    {isAdmin ? 'Administrator' : 'User'}
                  </div>
                </div>
              </div>
            )}

            {/* Main Navigation Links */}
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-[color:var(--muted-foreground)] uppercase tracking-wider mb-3">
                Navigation
              </h3>
              <Link 
                href="/services" 
                className="flex items-center px-3 py-3 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-lg transition-colors group"
                onClick={() => setOpen(false)}
              >
                <svg className="w-4 h-4 mr-3 text-[color:var(--muted-foreground)] group-hover:text-[color:var(--foreground)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Services
              </Link>
              <Link 
                href="/portfolio" 
                className="flex items-center px-3 py-3 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-lg transition-colors group"
                onClick={() => setOpen(false)}
              >
                <svg className="w-4 h-4 mr-3 text-[color:var(--muted-foreground)] group-hover:text-[color:var(--foreground)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Our Work
              </Link>
              <Link 
                href="/about" 
                className="flex items-center px-3 py-3 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-lg transition-colors group"
                onClick={() => setOpen(false)}
              >
                <svg className="w-4 h-4 mr-3 text-[color:var(--muted-foreground)] group-hover:text-[color:var(--foreground)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                About
              </Link>
              <Link 
                href="/contact" 
                className="flex items-center px-3 py-3 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-lg transition-colors group"
                onClick={() => setOpen(false)}
              >
                <svg className="w-4 h-4 mr-3 text-[color:var(--muted-foreground)] group-hover:text-[color:var(--foreground)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact
              </Link>
            </div>

            {/* Tools & Features */}
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-[color:var(--muted-foreground)] uppercase tracking-wider mb-3">
                Tools & Features
              </h3>
              <Link 
                href="/shop" 
                className="flex items-center px-3 py-3 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-lg transition-colors group"
                onClick={() => setOpen(false)}
              >
                <svg className="w-4 h-4 mr-3 text-[color:var(--muted-foreground)] group-hover:text-[color:var(--foreground)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Shop
              </Link>
              <Link 
                href="/visualizer" 
                className="flex items-center px-3 py-3 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-lg transition-colors group"
                onClick={() => setOpen(false)}
              >
                <svg className="w-4 h-4 mr-3 text-[color:var(--muted-foreground)] group-hover:text-[color:var(--foreground)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                AI Visualizer
              </Link>
            </div>

            {/* User Dashboard/Admin (if logged in) */}
            {!isLoading && user && (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-[color:var(--muted-foreground)] uppercase tracking-wider mb-3">
                  Account
                </h3>
                <Link 
                  href={isAdmin ? "/admin" : "/dashboard"} 
                  className="flex items-center px-3 py-3 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-lg transition-colors group"
                  onClick={() => setOpen(false)}
                >
                  <svg className="w-4 h-4 mr-3 text-[color:var(--muted-foreground)] group-hover:text-[color:var(--foreground)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {isAdmin ? 'Admin Panel' : 'Dashboard'}
                </Link>
                <Link 
                  href="/profile" 
                  className="flex items-center px-3 py-3 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-lg transition-colors group"
                  onClick={() => setOpen(false)}
                >
                  <svg className="w-4 h-4 mr-3 text-[color:var(--muted-foreground)] group-hover:text-[color:var(--foreground)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </Link>
              </div>
            )}

            {/* Call to Action */}
            <div className="space-y-2">
              <Link 
                href="/#quote" 
                className="block w-full px-4 py-3 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors text-center shadow-sm"
                onClick={() => setOpen(false)}
              >
                Get a Free Quote
              </Link>
              {!user && (
                <Link 
                  href="/login" 
                  className="block w-full px-4 py-3 text-sm font-medium border border-[color:var(--border)] text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-lg transition-colors text-center"
                  onClick={() => setOpen(false)}
                >
                  Login / Sign Up
                </Link>
              )}
            </div>
            
            {/* Mobile Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-[color:var(--border)]">
              <div className="flex items-center gap-3">
                <CartIcon />
                <ThemeToggle />
              </div>
              {user && (
                <button
                  onClick={async () => {
                    try {
                      await fetch("/api/auth/logout", { method: "POST" });
                      setUser(null);
                      setIsAdmin(false);
                      setOpen(false);
                      window.location.href = "/";
                    } catch (error) {
                      console.error("Logout error:", error);
                    }
                  }}
                  className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



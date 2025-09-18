"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import CartIcon from "@/components/CartIcon";
import AuthProvider from "@/components/AuthProvider";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
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

  return (
    <div className="lg:hidden relative" ref={menuRef}>
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu-panel"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-md text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-all duration-200"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {open ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div
          id="mobile-menu-panel"
          className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] shadow-xl backdrop-blur-md overflow-hidden z-50"
        >
          <div className="p-4 space-y-4">
            {/* Mobile Navigation Links */}
            <div className="space-y-1">
              <Link 
                href="/services" 
                className="block px-3 py-2 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-md transition-colors"
                onClick={() => setOpen(false)}
              >
                Services
              </Link>
              <Link 
                href="/portfolio" 
                className="block px-3 py-2 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-md transition-colors"
                onClick={() => setOpen(false)}
              >
                Our Work
              </Link>
              <Link 
                href="/about" 
                className="block px-3 py-2 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-md transition-colors"
                onClick={() => setOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className="block px-3 py-2 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-md transition-colors"
                onClick={() => setOpen(false)}
              >
                Contact
              </Link>
              <Link 
                href="/shop" 
                className="block px-3 py-2 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-md transition-colors"
                onClick={() => setOpen(false)}
              >
                Shop
              </Link>
              <Link 
                href="/visualizer" 
                className="block px-3 py-2 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-md transition-colors"
                onClick={() => setOpen(false)}
              >
                Visualizer
              </Link>
              <Link 
                href="/#quote" 
                className="block px-3 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors text-center"
                onClick={() => setOpen(false)}
              >
                Get a Quote
              </Link>
            </div>
            
            {/* Mobile Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-[color:var(--border)]">
              <div className="flex items-center gap-2">
                <CartIcon />
                <ThemeToggle />
              </div>
            </div>
            
            {/* Mobile Auth */}
            <div className="pt-2 border-t border-[color:var(--border)]">
              <AuthProvider />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



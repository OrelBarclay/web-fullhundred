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
    <div className="sm:hidden relative" ref={menuRef}>
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu-panel"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-md border border-[color:var(--border)] px-3 py-2 text-[color:var(--foreground)] bg-[color:var(--card)] hover:bg-[color:var(--muted)] transition-colors"
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
          className="absolute right-0 mt-2 w-[88vw] max-w-xs rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg overflow-hidden"
        >
          <div className="p-2 divide-y divide-[color:var(--border)]">
            <div className="flex items-center gap-2 pb-2">
              <CartIcon />
              <ThemeToggle />
            </div>
            <div className="py-2 flex flex-col">
              <Link href="/services" className="px-3 py-2 rounded-md text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-colors">Services</Link>
              <Link href="/portfolio" className="px-3 py-2 rounded-md text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-colors">Our Work</Link>
              <Link href="/contact" className="px-3 py-2 rounded-md text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-colors">Contact</Link>
              <Link href="/shop" className="px-3 py-2 rounded-md text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-colors">Shop</Link>
              <Link href="/#quote" className="mt-1 px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition">Get a Quote</Link>
            </div>
            <div className="pt-2">
              <AuthProvider />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



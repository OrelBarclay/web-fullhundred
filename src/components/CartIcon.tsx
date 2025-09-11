"use client";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function CartIcon() {
  const { items } = useCart();

  return (
    <Link 
      href="/cart" 
      className="relative group flex items-center justify-center w-10 h-10 rounded-md text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-all duration-200"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
      </svg>
      {items.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm animate-pulse">
          {items.length > 99 ? '99+' : items.length}
        </span>
      )}
    </Link>
  );
}

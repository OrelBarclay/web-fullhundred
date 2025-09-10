"use client";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function CartIcon() {
  const { items } = useCart();

  return (
    <Link href="/cart" className="relative hover:opacity-80 transition-opacity px-3 py-2 rounded-md border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition-colors">
      <svg className="w-5 h-5 text-[color:var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
      </svg>
      {items.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
          {items.length}
        </span>
      )}
    </Link>
  );
}

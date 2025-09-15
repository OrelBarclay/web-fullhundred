"use client";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { useEffect, useState } from "react";
import { getAuthInstance } from "@/lib/firebase";

export default function CartPage() {
  const { items, setQuantity, removeItem, subtotal, clear } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [hasAuthedEmail, setHasAuthedEmail] = useState(false);

  // Prefill email from authenticated user if available
  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = auth.onAuthStateChanged((u) => {
      const email = (u?.email || "").trim();
      if (email) {
        setCustomerEmail(email.toLowerCase());
        setHasAuthedEmail(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    // Validate email
    if (!customerEmail.trim()) {
      alert('Please enter your email address to continue with checkout.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
      alert('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      // Create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          customerEmail: customerEmail.trim().toLowerCase(),
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/cart`,
        }),
      });

      const { url } = await response.json();

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 text-[color:var(--foreground)]">
      <h1 className="text-3xl font-semibold text-primary mb-6">Cart</h1>
      {items.length === 0 ? (
        <div className="text-[color:var(--muted-foreground)]">Your cart is empty. <Link href="/shop" className="underline hover:no-underline">Browse products</Link>.</div>
      ) : (
        <div className="grid gap-6">
          <div className="border border-[color:var(--border)] bg-[color:var(--card)] rounded-lg p-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-b-0 border-[color:var(--border)]/60">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-[color:var(--muted-foreground)]">${(item.price / 100).toFixed(2)} each</div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => setQuantity(item.id, Math.max(1, Number(e.target.value)))}
                    className="w-20 border border-[color:var(--border)] bg-[color:var(--popover)] rounded px-2 py-1"
                  />
                  <button onClick={() => removeItem(item.id)} className="text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]">Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <div className="text-blue-500 text-lg">ℹ️</div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Important Note</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  All prices shown are for <strong>labor only</strong>. Materials will be quoted separately 
                  based on your specific project requirements and will be discussed during consultation.
                </p>
              </div>
            </div>
          </div>

          {/* Email Input or Prefilled Notice */}
          {hasAuthedEmail ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Using account email: <span className="font-medium">{customerEmail}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This email will be used to associate your order and projects.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
              <label htmlFor="customer-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="customer-email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Required for order tracking and project management
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-lg">Subtotal: <span className="font-semibold">${(subtotal / 100).toFixed(2)}</span></div>
            <div className="flex gap-3">
              <button 
                onClick={clear} 
                className="px-4 py-2 rounded border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition"
              >
                Clear
              </button>
              <button 
                onClick={handleCheckout}
                disabled={isLoading}
                className="px-6 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15l3-3 3 3M7 5l3 3 3-3" />
                    </svg>
                    Checkout with Stripe
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}



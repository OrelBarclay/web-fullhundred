"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';

function CheckoutSuccessContent() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const { clear } = useCart();

  useEffect(() => {
    // Debug: Log all search parameters
    console.log('All search params:', searchParams.toString());
    console.log('URL search params:', window.location.search);
    
    const sessionIdParam = searchParams.get('session_id');
    console.log('Session ID param:', sessionIdParam);
    
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
      // Clear the cart after successful payment
      clear();
    } else {
      // Check for alternative parameter names
      const altSessionId = searchParams.get('sessionId') || searchParams.get('session') || searchParams.get('id');
      console.log('Alternative session ID:', altSessionId);
      
      if (altSessionId) {
        setSessionId(altSessionId);
        clear();
      } else {
        setError('No session ID found. Please check the URL parameters.');
      }
    }
    setLoading(false);
  }, [searchParams, clear]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <Link
            href="/cart"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
          >
            Back to Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Thank you for your purchase. Your order has been processed successfully.
        </p>
        
        {sessionId && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Order ID:</strong> {sessionId}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              You will receive a confirmation email shortly.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
          >
            Continue Shopping
          </Link>
          <Link
            href="/dashboard"
            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            View Dashboard
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Questions about your order?</p>
          <p>Contact us at <a href="mailto:support@fullhundred.com" className="text-primary hover:underline">support@fullhundred.com</a></p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

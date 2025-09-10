import Stripe from 'stripe';
import { loadStripe, Stripe as StripeJS } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
  {
    apiVersion: '2025-08-27.basil',
    typescript: true,
  }
);

// Client-side Stripe instance
let stripePromise: Promise<StripeJS | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
    );
  }
  return stripePromise;
};

// Helper function to format price for Stripe (convert dollars to cents)
export const formatPriceForStripe = (priceInDollars: number): number => {
  return Math.round(priceInDollars * 100);
};

// Helper function to format price from Stripe (convert cents to dollars)
export const formatPriceFromStripe = (priceInCents: number): number => {
  return priceInCents / 100;
};

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { getDb } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        try {
          // Save order to database
          await saveOrderToDatabase(session as Stripe.Checkout.Session);
        } catch (dbError) {
          // Don't return error here as payment is already processed
        }
        
        break;

      case 'payment_intent.succeeded':
        // Payment succeeded
        break;

      case 'payment_intent.payment_failed':
        // Payment failed
        break;

      default:
        // Unhandled event type
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Function to save order to database
async function saveOrderToDatabase(session: Stripe.Checkout.Session) {
  const db = getDb();
  
  // Parse items from metadata
  let items = [];
  try {
    items = JSON.parse(session.metadata?.items || '[]');
  } catch (error) {
    items = [];
  }

  // Create order document
  const orderData = {
    id: session.id,
    customerEmail: session.customer_email,
    customerName: session.customer_details?.name || '',
    amountTotal: session.amount_total,
    amountSubtotal: session.amount_subtotal,
    currency: session.currency,
    paymentStatus: session.payment_status,
    status: 'completed',
    items: items,
    shippingAddress: (session as Stripe.Checkout.Session & { shipping_details?: { address?: Stripe.Address } }).shipping_details?.address || null,
    billingAddress: session.customer_details?.address || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    stripeSessionId: session.id,
    paymentIntentId: session.payment_intent,
  };

  // Save order to orders collection
  const orderRef = doc(db, 'orders', session.id);
  await setDoc(orderRef, orderData);

  // If we have customer email, also save to user's orders
  if (session.customer_email) {
    try {
      // Find user by email
      const usersRef = doc(db, 'users', session.customer_email);
      const userDoc = await getDoc(usersRef);
      
      if (userDoc.exists()) {
        // Add order to user's orders array
        await updateDoc(usersRef, {
          orders: arrayUnion(session.id),
          updatedAt: new Date()
        });
      } else {
        // Create user document if it doesn't exist
        await setDoc(usersRef, {
          email: session.customer_email,
          orders: [session.id],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (userError) {
      // Don't throw error as order is already saved
    }
  }

  // Clear user's cart after successful order
  if (session.customer_email) {
    try {
      const cartRef = doc(db, 'carts', session.customer_email);
      await setDoc(cartRef, {
        items: [],
        updatedAt: new Date(),
        userId: session.customer_email
      });
    } catch (cartError) {
      // Don't throw error as order is already saved
    }
  }

}

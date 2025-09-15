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

  // Upsert client record based on order customer
  let clientId: string | null = null;
  try {
    const clientEmail = session.customer_email || '';
    if (clientEmail) {
      clientId = clientEmail; // use email as client doc id for simplicity
      const clientDocRef = doc(db, 'clients', clientId);
      await setDoc(clientDocRef, {
        id: clientId,
        name: session.customer_details?.name || clientEmail.split('@')[0] || 'Customer',
        email: clientEmail,
        phone: session.customer_details?.phone || '',
        address: (session.customer_details?.address && JSON.stringify(session.customer_details.address)) || '',
        createdAt: new Date(),
        lastContact: new Date(),
        updatedAt: new Date(),
      }, { merge: true });
    }
  } catch (_clientErr) {
    // do not fail webhook on client upsert
  }

  // Create a corresponding project from this order
  try {
    const primaryTitle = Array.isArray(items) && items.length > 0 ? items[0]?.name || 'New Project' : 'New Project';
    const clientName = session.customer_details?.name || session.customer_email || 'Customer';
    const budget = typeof session.amount_total === 'number' ? Math.round(session.amount_total / 100) : 0; // dollars
    const projectId = `proj-${session.id}`;

    const projectDoc = doc(db, 'projects', projectId);
    await setDoc(projectDoc, {
      title: primaryTitle,
      clientId: clientId || session.customer_email || '',
      clientName,
      status: 'planning',
      startDate: new Date(),
      endDate: null,
      budget,
      progress: 0,
      createdFromOrderId: session.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });
  } catch (_err) {
    // swallow project creation errors to not block webhook
  }

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

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { items, customerEmail, successUrl, cancelUrl } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    // Require customer email for identification
    if (!customerEmail || typeof customerEmail !== 'string' || !customerEmail.trim()) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Basic validation
    if (process.env.STRIPE_SECRET_KEY?.includes('placeholder') || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe is not configured. Set STRIPE_SECRET_KEY.' }, { status: 500 });
    }

    // Calculate total amount (price is already in cents)
    const totalAmount = items.reduce((sum: number, item: { price: number; quantity: number }) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Create line items for Stripe
    function isValidHttpUrl(url?: string): boolean {
      if (!url) return false;
      try {
        const u = new URL(url);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    }

    const lineItems = items.map((item: { name: string; price: number; quantity: number; image?: string }) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: `Labor-only pricing for ${item.name}`,
          images: isValidHttpUrl(item.image) ? [item.image as string] : [],
        },
        // item.price is already in cents
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      customer_email: customerEmail.trim(),
      metadata: {
        items: JSON.stringify(items),
        totalAmount: totalAmount.toString(),
        customerEmail: customerEmail.trim(),
      },
      // Add shipping address collection if needed
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      // Add billing address collection
      billing_address_collection: 'required',
      // Add tax calculation if needed
      automatic_tax: {
        enabled: false, // Set to true if you want Stripe to calculate taxes
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

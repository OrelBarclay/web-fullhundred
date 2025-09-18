import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { priceCents } = await req.json();

    const amount = Number(priceCents);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.floor(amount),
            product_data: {
              name: 'Visualizer Credits - 10 AI Design Generations',
              description: 'Generate up to 10 AI-powered design visualizations for your spaces',
              images: [],
            },
          },
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/visualizer?credits=purchased`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/visualizer`,
      metadata: {
        type: 'visualizer_credits',
        credits: '10',
      },
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (e) {
    console.error('Visualizer credits purchase error:', e);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

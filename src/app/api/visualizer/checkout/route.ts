import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { priceCents, beforeImageUrl, resultImageUrl, styleId, styleLabel } = await req.json();

    const amount = Number(priceCents);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }
    if (!resultImageUrl) {
      return NextResponse.json({ error: 'Missing result image' }, { status: 400 });
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
              name: `Visualizer Design - ${styleLabel || styleId || 'Custom'}`,
              description: 'AI-generated design preview',
              images: resultImageUrl ? [resultImageUrl] : undefined,
            },
          },
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/visualizer`,
      metadata: {
        type: 'visualizer',
        beforeImageUrl: beforeImageUrl || '',
        resultImageUrl: resultImageUrl,
        styleId: styleId || '',
        styleLabel: styleLabel || '',
      },
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}



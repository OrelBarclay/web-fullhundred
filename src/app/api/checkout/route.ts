import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function POST(_req: NextRequest) {
  // Stub checkout endpoint. Integrate Stripe later.
  return NextResponse.json({ ok: true, message: "Checkout session would be created here." });
}



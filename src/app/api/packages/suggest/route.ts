import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/ai";

export const runtime = 'nodejs';

type SuggestRequest = {
  query: string;
  budget?: number; // USD
  timeline?: string;
  preferences?: string[];
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SuggestRequest;
  const key = JSON.stringify({ ...body });
  const cacheKey = `pkg_suggest:${key}`;
  const cached = cacheGet(cacheKey);
  if (cached) return NextResponse.json(cached);

  // Call internal search to get top services
  const searchUrl = new URL(`${req.nextUrl.origin}/api/services/search`);
  searchUrl.searchParams.set("q", body.query || "");
  searchUrl.searchParams.set("k", "8");
  const res = await fetch(searchUrl, { cache: "no-store" });
  const data = await res.json();
  const results = Array.isArray(data?.results) ? data.results : [];

  // Simple bundling heuristic: take top 2-3 within budget
  let total = 0;
  const included: Array<{ id: string; title: string; estimatedPrice: number }> = [];
  for (const s of results as Array<{ id: string; title: string; estimatedPrice?: number }>) {
    const price = Number(s.estimatedPrice || 0);
    if (!body.budget || total + price <= (body.budget ?? 0) * 1.05) {
      included.push({ id: s.id, title: s.title, estimatedPrice: price });
      total += price;
      if (included.length >= 3) break;
    }
  }

  const payload = {
    packages: [
      {
        name: "Suggested Package",
        includedServices: included,
        estimatedPriceMin: Math.max(0, Math.round(total * 0.9)),
        estimatedPriceMax: Math.round(total * 1.1),
        timeline: body.timeline || "4-8 weeks",
        rationale: `Built from top matches for "${body.query}" within your preferences and budget.`,
        upsellOptions: [
          "Extended warranty",
          "Premium materials",
          "Faster delivery"
        ],
      },
    ],
  };

  cacheSet(cacheKey, payload, 5 * 60_000); // 5 minutes
  return NextResponse.json(payload);
}



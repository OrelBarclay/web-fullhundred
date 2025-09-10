import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { cacheGet, cacheSet, cosineSim, estimateServicePriceUSD, toVector, tokenize } from "@/lib/ai";
import type { Service } from "@/server/db/schema";

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const k = Number(searchParams.get("k") || "8");
  if (!q) return NextResponse.json({ results: [] });

  const cacheKey = `svc_search:${q}:${k}`;
  const cached = cacheGet<{ results: unknown[] }>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const db = getDb();
  const snap = await getDocs(collection(db, "services"));
  const services: Array<Service & { id: string }> = snap.docs.map((d) => {
    const data = d.data() as Partial<Service>;
    return {
      id: d.id,
      title: data.title || "",
      description: data.description || "",
      features: Array.isArray(data.features) ? data.features as string[] : [],
      iconColor: data.iconColor || "",
      iconPath: data.iconPath || "",
      isActive: Boolean(data.isActive),
      order: Number(data.order || 0),
      createdAt: (data.createdAt as Date) || new Date(),
      updatedAt: (data.updatedAt as Date) || new Date(),
    } as Service & { id: string };
  });

  const qv = toVector(tokenize(q));
  type Scored = Service & { id: string; score: number; estimatedPrice: number };
  const scored: Scored[] = services.map((s) => {
    const text = `${s.title || ""} ${(s.description || "") + " " + (Array.isArray(s.features) ? s.features.join(" ") : "")}`;
    const sv = toVector(tokenize(text));
    const score = cosineSim(qv, sv);
    const price = estimateServicePriceUSD({ title: s.title || "", description: s.description || "" });
    return { ...s, score, estimatedPrice: price };
  });

  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, Math.max(1, Math.min(50, k)));

  const payload = { results };
  cacheSet(cacheKey, payload, 60_000); // 1 minute TTL
  return NextResponse.json(payload);
}



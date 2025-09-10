export type Vector = Map<string, number>;

export function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => t.length > 1);
}

export function toVector(tokens: string[]): Vector {
  const v: Vector = new Map();
  for (const t of tokens) v.set(t, (v.get(t) || 0) + 1);
  return v;
}

export function cosineSim(a: Vector, b: Vector): number {
  let dot = 0;
  let a2 = 0;
  let b2 = 0;
  for (const [, av] of a) a2 += av * av;
  for (const [, bv] of b) b2 += bv * bv;
  const keys = new Set([...a.keys(), ...b.keys()]);
  for (const k of keys) dot += (a.get(k) || 0) * (b.get(k) || 0);
  const denom = Math.sqrt(a2) * Math.sqrt(b2) || 1;
  return dot / denom;
}

// Simple TTL cache
type CacheEntry<T> = { value: T; expiresAt: number };
const cache = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const now = Date.now();
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < now) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// Heuristic pricing from service title/description (LABOR ONLY - materials quoted separately)
export function estimateServicePriceUSD(service: { title: string; description: string }): number {
  const text = `${service.title} ${service.description}`.toLowerCase();
  
  // Kitchen services - $8,000 - $25,000 (labor only)
  if (text.includes("kitchen")) {
    if (text.includes("remodel") || text.includes("renovation")) return 20000;
    if (text.includes("cabinet") || text.includes("countertop")) return 15000;
    if (text.includes("appliance") || text.includes("fixture")) return 8000;
    return 18000; // Default kitchen service
  }
  
  // Bathroom services - $4,000 - $15,000 (labor only)
  if (text.includes("bathroom")) {
    if (text.includes("remodel") || text.includes("renovation")) return 12000;
    if (text.includes("tile") || text.includes("shower")) return 8000;
    if (text.includes("fixture") || text.includes("vanity")) return 5000;
    return 7000; // Default bathroom service
  }
  
  // Home additions - $15,000 - $40,000 (labor only)
  if (text.includes("addition")) {
    if (text.includes("room") || text.includes("bedroom")) return 25000;
    if (text.includes("family") || text.includes("living")) return 35000;
    if (text.includes("master") || text.includes("suite")) return 40000;
    return 30000; // Default addition
  }
  
  // Outdoor/Deck services - $3,000 - $12,000 (labor only)
  if (text.includes("deck") || text.includes("patio")) {
    if (text.includes("composite") || text.includes("trex")) return 8000;
    if (text.includes("pressure") || text.includes("wood")) return 6000;
    if (text.includes("roof") || text.includes("cover")) return 10000;
    return 7000; // Default deck service
  }
  
  // Roofing services - $2,000 - $8,000 (labor only)
  if (text.includes("roof")) {
    if (text.includes("replace") || text.includes("new")) return 6000;
    if (text.includes("repair") || text.includes("patch")) return 2000;
    if (text.includes("gutter") || text.includes("drain")) return 1500;
    return 4000; // Default roofing service
  }
  
  // Flooring services - $2,000 - $8,000 (labor only)
  if (text.includes("floor")) {
    if (text.includes("hardwood") || text.includes("engineered")) return 6000;
    if (text.includes("tile") || text.includes("ceramic")) return 4000;
    if (text.includes("carpet") || text.includes("vinyl")) return 2500;
    return 3500; // Default flooring service
  }
  
  // Carpentry services - $1,500 - $6,000 (labor only)
  if (text.includes("carpentry") || text.includes("woodwork")) {
    if (text.includes("custom") || text.includes("built-in")) return 5000;
    if (text.includes("trim") || text.includes("molding")) return 2000;
    if (text.includes("repair") || text.includes("fix")) return 1500;
    return 3000; // Default carpentry service
  }
  
  // Electrical services - $800 - $4,000 (labor only)
  if (text.includes("electrical") || text.includes("wiring")) {
    if (text.includes("panel") || text.includes("upgrade")) return 3000;
    if (text.includes("outlet") || text.includes("switch")) return 800;
    if (text.includes("light") || text.includes("fixture")) return 1200;
    return 2000; // Default electrical service
  }
  
  // Plumbing services - $600 - $3,000 (labor only)
  if (text.includes("plumbing") || text.includes("pipe")) {
    if (text.includes("water") || text.includes("sewer")) return 2500;
    if (text.includes("fixture") || text.includes("faucet")) return 1000;
    if (text.includes("repair") || text.includes("leak")) return 600;
    return 1500; // Default plumbing service
  }
  
  // HVAC services - $1,000 - $5,000 (labor only)
  if (text.includes("hvac") || text.includes("heating") || text.includes("cooling")) {
    if (text.includes("system") || text.includes("replace")) return 4000;
    if (text.includes("repair") || text.includes("maintenance")) return 1000;
    if (text.includes("duct") || text.includes("vent")) return 1500;
    return 2500; // Default HVAC service
  }
  
  // Management/Consultation services - $200 - $1,500 (labor only)
  if (text.includes("management") || text.includes("consultation")) {
    if (text.includes("project") || text.includes("general")) return 1000;
    if (text.includes("design") || text.includes("planning")) return 800;
    if (text.includes("inspection") || text.includes("assessment")) return 200;
    return 600; // Default management service
  }
  
  // Default for unknown services - $2,000 - $8,000 (labor only)
  return 4000;
}



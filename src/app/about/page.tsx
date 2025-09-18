"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12 text-[color:var(--foreground)]">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-primary">About Full100services</h1>
        <p className="mt-2 text-[color:var(--muted-foreground)]">
          We are renovation specialists committed to transforming spaces with precision, quality, and care.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="border border-[color:var(--border)] rounded-lg p-6 bg-[color:var(--card)]">
          <h2 className="text-xl font-semibold mb-3 text-primary">Our Mission</h2>
          <p className="text-[color:var(--muted-foreground)] leading-relaxed">
            At Full100services, our mission is to deliver end‑to‑end remodeling and renovation services that are
            transparent, on‑time, and crafted to last. We combine traditional craftsmanship with modern tools like
            AI‑powered visualizations to help you see—and love—your space before a single tile is laid.
          </p>
        </div>

        <div className="border border-[color:var(--border)] rounded-lg p-6 bg-[color:var(--card)]">
          <h2 className="text-xl font-semibold mb-3 text-primary">What We Do</h2>
          <ul className="list-disc pl-5 space-y-2 text-[color:var(--muted-foreground)]">
            <li>Kitchen, bathroom, and outdoor/patio renovations</li>
            <li>Custom design and build with material guidance</li>
            <li>AI Design Visualizer to explore styles before construction</li>
            <li>Project tracking, transparent estimates, and clear timelines</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3 mt-8">
        <div className="border border-[color:var(--border)] rounded-lg p-5 bg-[color:var(--card)] text-center">
          <div className="text-3xl font-bold">100%</div>
          <div className="text-[color:var(--muted-foreground)]">Quality Commitment</div>
        </div>
        <div className="border border-[color:var(--border)] rounded-lg p-5 bg-[color:var(--card)] text-center">
          <div className="text-3xl font-bold">On‑Time</div>
          <div className="text-[color:var(--muted-foreground)]">Milestone Delivery</div>
        </div>
        <div className="border border-[color:var(--border)] rounded-lg p-5 bg-[color:var(--card)] text-center">
          <div className="text-3xl font-bold">Clear</div>
          <div className="text-[color:var(--muted-foreground)]">Up‑front Pricing</div>
        </div>
      </div>

      <div className="mt-10 border border-[color:var(--border)] rounded-lg p-6 bg-[color:var(--card)]">
        <h2 className="text-xl font-semibold mb-3 text-primary">Our Promise</h2>
        <p className="text-[color:var(--muted-foreground)] leading-relaxed">
          From first sketch to final walkthrough, we keep communication clear and decisions collaborative. Whether
          you are refreshing a bathroom, opening a kitchen, or upgrading your outdoor living, we bring experience,
          accountability, and craftsmanship to every detail.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/services" className="px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 transition">
          Explore Services
        </Link>
        <Link href="/contact" className="px-4 py-2 rounded border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition">
          Get a Free Quote
        </Link>
      </div>
    </section>
  );
}

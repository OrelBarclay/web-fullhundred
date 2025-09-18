"use client";
import Image from "next/image";
import QuoteForm from "@/components/QuoteForm";
import Reviews from "@/components/Reviews";

export default function Home() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 grid gap-16">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div className="grid gap-6">
          <h1 className="text-4xl md:text-5xl text-primary dark:text-primary-foreground font-semibold tracking-tight">Transforming Spaces with Precision and Craft</h1>
          <p className="text-lg text-[color:var(--muted-foreground)]">We design, build, and renovate with a relentless focus on quality. Explore our portfolio and get a free, no-obligation quote today.</p>
          <div className="flex gap-4">
            <a href="#quote" className="px-5 py-3 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition">Get a Free Quote</a>
            <a href="/portfolio" className="px-5 py-3 rounded-md border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition">View Our Work</a>
          </div>
        </div>
        <div className="aspect-[16/10] rounded-lg bg-[color:oklch(0.95_0_0)] dark:bg-[color:oklch(0.21_0.006_285.885)] border border-[color:var(--border)]">
          <Image src="/images/hero.jpg" alt="Hero" className="w-full h-full object-cover rounded-lg" width={1000} height={1000} />
        </div>
      </div>

      <Reviews />

      <div id="quote">
        <QuoteForm />
      </div>
    </section>
  );
}

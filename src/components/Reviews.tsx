"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

type Testimonial = {
  id?: string;
  name: string;
  text: string;
  rating: number; // 1-5
  photoUrl?: string | null;
};

const DEFAULTS: Testimonial[] = [
  { name: "Sophia R.", text: "Immaculate finish and clear communication throughout our kitchen remodel.", rating: 5 },
  { name: "Marcus T.", text: "On-time and on-budget. The team handled surprises professionally.", rating: 5 },
  { name: "Ava K.", text: "Visualizer helped us choose a style we love before work began!", rating: 5 },
];

const STAR = (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="w-4 h-4">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.801 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.801-2.035a1 1 0 00-1.175 0l-2.801 2.035c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.88 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);

export default function Reviews() {
  const [items, setItems] = useState<Testimonial[]>(DEFAULTS);
  const [avg, setAvg] = useState<number>(4.9);
  const [count, setCount] = useState<number>(128);
  const params = useSearchParams();
  const projectId = params.get("projectId");
  const customerEmail = params.get("email");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reviews", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const fetched: Testimonial[] = Array.isArray(data?.items) ? data.items : [];
        if (!cancelled && fetched.length > 0) {
          setItems(fetched.slice(0, 9));
          const ratings = fetched.map((r) => Number(r.rating) || 0).filter((n) => n > 0);
          const average = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 4.9;
          setAvg(Math.min(5, Math.max(1, average)));
          setCount(fetched.length);
        }
      } catch {
        // keep defaults
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = Boolean(projectId && customerEmail);

  return (
    <section className="border border-[color:var(--border)] rounded-lg p-6 bg-[color:var(--card)]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm text-[color:var(--muted-foreground)]">Customer satisfaction</div>
          <div className="text-2xl font-semibold text-[color:var(--foreground)] flex items-center gap-2">
            {avg.toFixed(1)}
            <div className="flex text-yellow-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < Math.round(avg) ? "opacity-100" : "opacity-30"}>{STAR}</span>
              ))}
            </div>
          </div>
          <div className="text-xs text-[color:var(--muted-foreground)]">Based on {count}+ verified reviews</div>
        </div>
        <a href="/portfolio" className="px-3 py-2 rounded border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition text-sm">See our work</a>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {items.map((t, idx) => (
          <figure key={t.id || idx} className="border border-[color:var(--border)] rounded-lg p-4 bg-[color:var(--background)]">
            <div className="flex items-center gap-3">
              {t.photoUrl ? (
                <Image src={t.photoUrl} alt={t.name} width={40} height={40} className="rounded-full object-cover border border-[color:var(--border)]" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[color:var(--muted)] flex items-center justify-center text-sm font-semibold">
                  {(t.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-medium text-[color:var(--foreground)]">{t.name}</div>
                <div className="flex text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < t.rating ? "opacity-100" : "opacity-30"}>{STAR}</span>
                  ))}
                </div>
              </div>
            </div>
            <blockquote className="mt-3 text-[color:var(--foreground)] leading-relaxed">“{t.text}”</blockquote>
          </figure>
        ))}
      </div>

      {canSubmit && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement;
            const fd = new FormData(form);
            const name = String(fd.get("name") || "").trim();
            const text = String(fd.get("text") || "").trim();
            const rating = Number(fd.get("rating") || 5);
            const photo = fd.get("photo") as File | null;

            if (!name || !text) return;

            let photoUrl: string | null = null;
            try {
              if (photo && photo.size > 0) {
                const up = new FormData();
                up.append("file", photo);
                up.append("folder", "reviews");
                const r = await fetch("/api/cloudinary-upload", { method: "POST", body: up });
                if (r.ok) {
                  const j = await r.json();
                  photoUrl = j.secure_url as string;
                }
              }
            } catch {}

            const res = await fetch("/api/reviews", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, text, rating, photoUrl, projectId, customerEmail }),
            });
            if (res.ok) {
              const { id } = await res.json();
              setItems((prev) => [{ id, name, text, rating, photoUrl }, ...prev].slice(0, 9));
              const newAvg = (avg * count + rating) / (count + 1);
              setAvg(newAvg);
              setCount(count + 1);
              form.reset();
            }
          }}
          className="mt-8 border border-[color:var(--border)] rounded-lg p-4 bg-[color:var(--card)] grid gap-3"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <input name="name" required placeholder="Your name" className="px-3 py-2 rounded border border-[color:var(--border)] bg-[color:var(--background)]" />
            <select name="rating" defaultValue={5} className="px-3 py-2 rounded border border-[color:var(--border)] bg-[color:var(--background)]">
              {[5,4,3,2,1].map((r) => (
                <option key={r} value={r}>{r} Stars</option>
              ))}
            </select>
          </div>
          <textarea name="text" required placeholder="Share your experience" rows={3} className="px-3 py-2 rounded border border-[color:var(--border)] bg-[color:var(--background)]" />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <input type="file" name="photo" accept="image/*" className="text-sm" />
            <button type="submit" className="px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 transition">Submit Review</button>
          </div>
        </form>
      )}

      {!canSubmit && (
        <div className="mt-6 text-xs text-[color:var(--muted-foreground)]">
          Reviews can be submitted by customers after a project is completed. Use your one-time link from your completion email.
        </div>
      )}
    </section>
  );
}

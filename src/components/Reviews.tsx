"use client";

type Testimonial = {
  name: string;
  text: string;
  rating: number; // 1-5
};

const STAR = (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="w-4 h-4">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.801 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.801-2.035a1 1 0 00-1.175 0l-2.801 2.035c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.88 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);

export default function Reviews({
  average = 4.9,
  count = 128,
  testimonials = [
    { name: "Sophia R.", text: "Immaculate finish and clear communication throughout our kitchen remodel.", rating: 5 },
    { name: "Marcus T.", text: "On-time and on-budget. The team handled surprises professionally.", rating: 5 },
    { name: "Ava K.", text: "Visualizer helped us choose a style we love before work began!", rating: 5 },
  ],
}: {
  average?: number;
  count?: number;
  testimonials?: Testimonial[];
}) {
  return (
    <section className="border border-[color:var(--border)] rounded-lg p-6 bg-[color:var(--card)]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm text-[color:var(--muted-foreground)]">Customer satisfaction</div>
          <div className="text-2xl font-semibold text-[color:var(--foreground)] flex items-center gap-2">
            {average.toFixed(1)}
            <div className="flex text-yellow-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < Math.round(average) ? "opacity-100" : "opacity-30"}>{STAR}</span>
              ))}
            </div>
          </div>
          <div className="text-xs text-[color:var(--muted-foreground)]">Based on {count}+ verified reviews</div>
        </div>
        <a href="/portfolio" className="px-3 py-2 rounded border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition text-sm">See our work</a>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {testimonials.map((t, idx) => (
          <figure key={idx} className="border border-[color:var(--border)] rounded-lg p-4 bg-[color:var(--background)]">
            <div className="flex items-center gap-2 text-yellow-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < t.rating ? "opacity-100" : "opacity-30"}>{STAR}</span>
              ))}
            </div>
            <blockquote className="mt-2 text-[color:var(--foreground)]">“{t.text}”</blockquote>
            <figcaption className="mt-1 text-xs text-[color:var(--muted-foreground)]">— {t.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

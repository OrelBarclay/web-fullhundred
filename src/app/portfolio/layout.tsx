import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Work | Full Hundred Portfolio",
  description: "Explore completed renovations showcasing our craftsmanship and attention to detail.",
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}



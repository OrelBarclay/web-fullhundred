import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Renovation Packages | Full Hundred",
  description:
    "Browse AI-crafted renovation packages with labor-only pricing. Materials quoted separately after consultation.",
  alternates: { canonical: "/shop" },
  openGraph: {
    url: "/shop",
    title: "Shop Renovation Packages | Full Hundred",
    description:
      "Browse AI-crafted renovation packages with labor-only pricing. Materials quoted separately after consultation.",
    images: [
      { url: "/images/og/cover.jpg", width: 1200, height: 630, alt: "Full Hundred Shop" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Renovation Packages | Full Hundred",
    description:
      "Browse AI-crafted renovation packages with labor-only pricing. Materials quoted separately after consultation.",
    images: ["/images/og/cover.jpg"],
  },
};

export default function ShopSectionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}



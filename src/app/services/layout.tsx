import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Services | Full Hundred",
  description: "Kitchen remodels, bathroom renovations, additions, custom carpentry, and more.",
  alternates: { canonical: "/services" },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}



import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Design Visualizer | Full Hundred",
  description: "Upload your bathroom photo and preview an AI-enhanced renovation design instantly.",
  alternates: { canonical: "/visualizer" },
};

export default function VisualizerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}



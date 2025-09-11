import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Full Hundred",
  description: "Reach our team to discuss your project or schedule a consultation.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}



import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import AuthProvider from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Full Hundred - Transforming Spaces with Precision and Craft",
  description: "We design, build, and renovate with a relentless focus on quality. Explore our portfolio and get a free, no-obligation quote today.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="w-full border-b border-black/[.08] dark:border-white/[.12]">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold tracking-tight">Full Hundred</Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/portfolio" className="hover:underline">View Our Work</Link>
              <Link href="/#quote" className="hover:underline">Get a Free Quote</Link>
              <AuthProvider />
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="w-full border-t mt-16 border-black/[.08] dark:border-white/[.12]">
          <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-center opacity-80">
            © {new Date().getFullYear()} Full Hundred. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}

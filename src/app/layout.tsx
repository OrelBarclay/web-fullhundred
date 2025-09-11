import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import AuthProvider from "@/components/AuthProvider";
import Logo from "@/components/Logo";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import CartProvider from "@/components/CartProvider";
import CartIcon from "@/components/CartIcon";
import MobileMenu from "@/components/MobileMenu";
import AssistantWidget from "@/components/AssistantWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://fullhundred.com"),
  title: {
    default: "Full Hundred - Transforming Spaces with Precision and Craft",
    template: "%s | Full Hundred",
  },
  description:
    "We design, build, and renovate with a relentless focus on quality. Explore our portfolio and get a free, no-obligation quote today.",
  keywords: [
    "home renovation",
    "bathroom remodel",
    "kitchen remodeling",
    "custom carpentry",
    "Full Hundred",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Full Hundred - Transforming Spaces with Precision and Craft",
    description:
      "We design, build, and renovate with a relentless focus on quality. Explore our portfolio and get a free, no-obligation quote today.",
    images: [
      {
        url: "/images/og/cover.jpg",
        width: 1200,
        height: 630,
        alt: "Full Hundred craftsmanship",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Full Hundred - Transforming Spaces with Precision and Craft",
    description:
      "We design, build, and renovate with a relentless focus on quality. Explore our portfolio and get a free, no-obligation quote today.",
    images: ["/images/og/cover.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/images/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/favicons/favicon.ico" },
    ],
    apple: [
      { url: "/images/favicons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/images/favicons/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
        <CartProvider>
        <header className="w-full sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--card)]/95 backdrop-blur-md shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center group">
                <Logo />
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-1">
                <Link 
                  href="/services" 
                  className="px-3 py-2 text-sm font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-md transition-all duration-200"
                >
                  Services
                </Link>
                <Link 
                  href="/portfolio" 
                  className="px-3 py-2 text-sm font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-md transition-all duration-200"
                >
                  Our Work
                </Link>
                <Link 
                  href="/contact" 
                  className="px-3 py-2 text-sm font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-md transition-all duration-200"
                >
                  Contact
                </Link>
                <Link 
                  href="/#quote" 
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Get a Quote
                </Link>
                <Link 
                  href="/shop" 
                  className="px-3 py-2 text-sm font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-md transition-all duration-200"
                >
                  Shop
                </Link>
                <Link 
                  href="/visualizer" 
                  className="px-3 py-2 text-sm font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-md transition-all duration-200"
                >
                  Visualizer
                </Link>
              </nav>
              
              {/* Right side - Cart, Theme, Auth */}
              <div className="flex items-center gap-2 sm:gap-3">
                <CartIcon />
                <ThemeToggle />
                <AuthProvider />
              </div>
              
              {/* Mobile Menu */}
              <MobileMenu />
            </div>
          </div>
        </header>
        <main>{children}</main>
        <AssistantWidget />
        
        <footer className="bg-[color:var(--card)] text-[color:var(--foreground)] border-t border-[color:var(--border)]">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Company Info */}
              <div className="lg:col-span-2">
                <h3 className="text-2xl font-bold mb-4">Full Hundred</h3>
                <p className="text-[color:var(--muted-foreground)] mb-6 max-w-md">
                  We design, build, and renovate with a relentless focus on quality. 
                  Transforming spaces with precision and craft since day one.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition-colors text-[color:var(--muted-foreground)]">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </a>
                  <a href="#" className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition-colors text-[color:var(--muted-foreground)]">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                    </svg>
                  </a>
                  <a href="#" className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition-colors text-[color:var(--muted-foreground)]">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                    </svg>
                  </a>
                  <a href="#" className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition-colors text-[color:var(--muted-foreground)]">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/" className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/services" className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link href="/portfolio" className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">
                      Our Work
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="/#quote" className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">
                      Get Quote
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">
                      Client Login
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Services */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Services</h4>
                <ul className="space-y-2">
                  <li className="text-gray-500 dark:text-white">Kitchen Remodeling</li>
                  <li className="text-gray-500 dark:text-white">Bathroom Renovation</li>
                  <li className="text-gray-500 dark:text-white">Home Additions</li>
                  <li className="text-gray-500 dark:text-white">Custom Carpentry</li>
                  <li className="text-gray-500 dark:text-white">Project Management</li>
                </ul>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-[color:var(--border)] mt-12 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="text-[color:var(--muted-foreground)] text-sm mb-4 md:mb-0">
                  © {new Date().getFullYear()} Full Hundred. All rights reserved.
                </div>
                <div className="flex space-x-6 text-sm">
                  <Link href="#" className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">
                    Privacy Policy
                  </Link>
                  <Link href="#" className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">
                    Terms of Service
                  </Link>
                  <Link href="#" className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">
                    Cookie Policy
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
        </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

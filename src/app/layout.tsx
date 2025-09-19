import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import ActiveLink from "@/components/ActiveLink";
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
    default: "Full100services - Transforming Spaces with Precision and Craft",
    template: "%s | Full Hundred",
  },
  description:
    "We design, build, and renovate with a relentless focus on quality. Explore our portfolio and get a free, no-obligation quote today.",
  keywords: [
    "home renovation",
    "bathroom remodel",
    "kitchen remodeling",
    "custom carpentry",
    "Full100services",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Full100services - Transforming Spaces with Precision and Craft",
    description:
      "We design, build, and renovate with a relentless focus on quality. Explore our portfolio and get a free, no-obligation quote today.",
    images: [
      {
        url: "/images/og/cover.jpg",
        width: 1200,
        height: 630,
        alt: "Full100services craftsmanship",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Full100services - Transforming Spaces with Precision and Craft",
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
                <ActiveLink href="/services">Services</ActiveLink>
                <ActiveLink href="/portfolio">Our Work</ActiveLink>
                <ActiveLink href="/about">About</ActiveLink>
                <ActiveLink href="/contact">Contact</ActiveLink>
                {/* <Link 
                  href="/#quote" 
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Get a Quote
                </Link> */}
                <ActiveLink href="/shop">Shop</ActiveLink>
                <ActiveLink href="/visualizer">Visualizer</ActiveLink>
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
                <h3 className="text-2xl font-bold mb-4">Full100services</h3>
                <p className="text-[color:var(--muted-foreground)] mb-6 max-w-md">
                  We design, build, and renovate with a relentless focus on quality. 
                  Transforming spaces with precision and craft since day one.
                </p>
                <div className="flex space-x-4">
                  <a href="https://www.facebook.com/full100service" className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition-colors text-[color:var(--muted-foreground)]">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a href="https://www.instagram.com/full100service" className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition-colors text-[color:var(--muted-foreground)]">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.281c-.49 0-.98-.49-.98-.98s.49-.98.98-.98.98.49.98.98-.49.98-.98.98zm-7.83 1.297c-2.026 0-3.323 1.297-3.323 3.323s1.297 3.323 3.323 3.323 3.323-1.297 3.323-3.323-1.297-3.323-3.323-3.323z"/>
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
                    <Link href="/about" className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">
                      About
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
                  © {new Date().getFullYear()} Full100services. All rights reserved.
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

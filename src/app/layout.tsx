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
import { FaFacebook, FaInstagram, FaPinterest, FaLinkedin } from "react-icons/fa";

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
              <Link href="/" className="flex items-center group flex-shrink-0">
                <Logo />
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
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
              
              {/* Right side - Cart, Theme, Auth (Desktop) */}
              <div className="hidden lg:flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <CartIcon />
                <ThemeToggle />
                <AuthProvider />
              </div>
              
              {/* Mobile Controls */}
              <div className="flex lg:hidden items-center gap-2 flex-shrink-0">
                <CartIcon />
                <ThemeToggle />
                <MobileMenu />
              </div>
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
                    <FaFacebook className="w-6 h-6" />
                  </a>
                  <a href="https://www.instagram.com/full100service" className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition-colors text-[color:var(--muted-foreground)]">
                    <FaInstagram className="w-6 h-6" />
                  </a>
                  <a href="#" className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition-colors text-[color:var(--muted-foreground)]">
                    <FaPinterest className="w-6 h-6" />
                  </a>
                  <a href="#" className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition-colors text-[color:var(--muted-foreground)]">
                    <FaLinkedin className="w-6 h-6" />
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

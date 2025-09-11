"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Logo() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if dark mode is enabled
    const checkDarkMode = () => {
      // Source of truth order:
      // 1) HTML class 'dark' (e.g., when using class strategy)
      // 2) Explicit localStorage theme ('dark' | 'light')
      // 3) System preference (when theme is 'system' or not set)
      const htmlIsDark = document.documentElement.classList.contains('dark');
      if (htmlIsDark) {
        setIsDark(true);
        return;
      }

      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'dark') {
        setIsDark(true);
        return;
      }
      if (storedTheme === 'light') {
        setIsDark(false);
        return;
      }

      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
    };

    checkDarkMode();

    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    // Some browsers use addListener/removeListener
    const onMediaChange = () => checkDarkMode();
    const supportsAddEvent = typeof mediaQuery.addEventListener === 'function';
    const legacyAddListener = (mediaQuery as MediaQueryList & {
      addListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
    }).addListener;
    if (supportsAddEvent) {
      mediaQuery.addEventListener('change', onMediaChange);
    } else if (typeof legacyAddListener === 'function') {
      legacyAddListener.call(mediaQuery, onMediaChange);
    }

    // Listen for storage changes (if theme is changed in another tab)
    window.addEventListener('storage', checkDarkMode);

    // Observe class changes on <html> so we react immediately to toggles
    const observer = new MutationObserver(() => checkDarkMode());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      const supportsRemoveEvent = typeof mediaQuery.removeEventListener === 'function';
      const legacyRemoveListener = (mediaQuery as MediaQueryList & {
        removeListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
      }).removeListener;
      if (supportsRemoveEvent) {
        mediaQuery.removeEventListener('change', onMediaChange);
      } else if (typeof legacyRemoveListener === 'function') {
        legacyRemoveListener.call(mediaQuery, onMediaChange);
      }
      window.removeEventListener('storage', checkDarkMode);
      observer.disconnect();
    };
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="w-[100px] sm:w-[140px] lg:w-[160px] h-[40px] sm:h-[56px] lg:h-[64px] bg-gray-200 rounded animate-pulse" />
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Image
        src={isDark ? "/images/logo-dark.png" : "/images/logo-light.png"}
        alt="Full Hundred Logo"
        width={160}
        height={64}
        className="w-[100px] h-[40px] sm:w-[140px] sm:h-[56px] lg:w-[160px] lg:h-[64px]"
        priority
      />
      <span className="text-base sm:text-lg lg:text-xl font-semibold text-[color:var(--foreground)] hidden sm:inline">
        Full Hundred LLC
      </span>
    </div>
  );
}

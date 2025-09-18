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
    <div className="flex items-center gap-1 sm:gap-2">
      <Image
        src={isDark ? "/images/logo-dark.png" : "/images/logo-light.png"}
        alt="Full100services Logo"
        width={180}
        height={48}
        sizes="(min-width: 1024px) 180px, (min-width: 640px) 160px, 140px"
        className="h-12 sm:h-14 lg:h-16 w-auto"
        priority
      />
      <span className="text-base sm:text-lg lg:text-xl font-semibold text-[color:var(--foreground)] hidden sm:inline">
        Full100services
      </span>
    </div>
  );
}

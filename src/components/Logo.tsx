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
      // Check for dark class on html element
      const isDarkMode = document.documentElement.classList.contains('dark') ||
                        // Check for dark mode in localStorage
                        localStorage.getItem('theme') === 'dark' ||
                        // Check for system preference
                        (localStorage.getItem('theme') === 'system' && 
                         window.matchMedia('(prefers-color-scheme: dark)').matches) ||
                        // Fallback: check if no theme is set and system prefers dark
                        (!localStorage.getItem('theme') && 
                         window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      setIsDark(isDarkMode);
    };

    checkDarkMode();

    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    // Listen for storage changes (if theme is changed in another tab)
    window.addEventListener('storage', checkDarkMode);

    return () => {
      mediaQuery.removeEventListener('change', checkDarkMode);
      window.removeEventListener('storage', checkDarkMode);
    };
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="w-[100px] h-[40px] bg-gray-200 rounded animate-pulse" />
    );
  }

  return (
    <Image
      src={isDark ? "/images/logo-dark.png" : "/images/logo-light.png"}
      alt="Full Hundred Logo"
      width={100}
      height={40}
      className="h-auto"
      priority
    />
  );
}

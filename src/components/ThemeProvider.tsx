"use client";

import { useEffect, useState } from "react";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: "system" | "light" | "dark";
};

export default function ThemeProvider({ children, defaultTheme = "system" }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const applyTheme = () => {
      const storedTheme = localStorage.getItem("theme");
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const resolvedTheme = storedTheme ?? defaultTheme;

      const isDark = resolvedTheme === "dark" || (resolvedTheme === "system" && systemPrefersDark);
      document.documentElement.classList.toggle("dark", isDark);
    };

    applyTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onMediaChange = () => applyTheme();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme") applyTheme();
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onMediaChange);
    } else if (typeof (mediaQuery as MediaQueryList & { addListener?: (cb: () => void) => void }).addListener === "function") {
      (mediaQuery as MediaQueryList & { addListener?: (cb: () => void) => void }).addListener!(onMediaChange);
    }

    window.addEventListener("storage", onStorage);

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", onMediaChange);
      } else if (typeof (mediaQuery as MediaQueryList & { removeListener?: (cb: () => void) => void }).removeListener === "function") {
        (mediaQuery as MediaQueryList & { removeListener?: (cb: () => void) => void }).removeListener!(onMediaChange);
      }
      window.removeEventListener("storage", onStorage);
    };
  }, [defaultTheme]);

  if (!mounted) {
    return children;
  }

  return children;
}



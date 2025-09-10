"use client";

import { useEffect, useState } from "react";

type ThemeOption = "light" | "dark" | "system";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeOption>("system");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as ThemeOption | null) ?? "system";
    setTheme(stored);
  }, []);

  const applyTheme = (value: ThemeOption) => {
    localStorage.setItem("theme", value);

    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = value === "dark" || (value === "system" && systemPrefersDark);
    document.documentElement.classList.toggle("dark", isDark);

    // Notify other listeners (ThemeProvider storage listener, other tabs)
    window.dispatchEvent(new StorageEvent("storage", { key: "theme", newValue: value }));
    setTheme(value);
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border px-1.5 py-1 bg-[color:var(--card)] text-[color:var(--foreground)]">
      <button
        aria-label="Light theme"
        onClick={() => applyTheme("light")}
        className={`px-2 py-1 text-xs rounded-md transition-colors ${theme === "light" ? "bg-primary text-primary-foreground" : "hover:bg-[color:var(--muted)]"}`}
      >
        Light
      </button>
      <button
        aria-label="System theme"
        onClick={() => applyTheme("system")}
        className={`px-2 py-1 text-xs rounded-md transition-colors ${theme === "system" ? "bg-primary text-primary-foreground" : "hover:bg-[color:var(--muted)]"}`}
      >
        System
      </button>
      <button
        aria-label="Dark theme"
        onClick={() => applyTheme("dark")}
        className={`px-2 py-1 text-xs rounded-md transition-colors ${theme === "dark" ? "bg-primary text-primary-foreground" : "hover:bg-[color:var(--muted)]"}`}
      >
        Dark
      </button>
    </div>
  );
}



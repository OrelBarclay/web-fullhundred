"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type ActiveLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  exact?: boolean;
};

export default function ActiveLink({ href, children, className, exact = false }: ActiveLinkProps) {
  const pathname = usePathname();
  const isActive = React.useMemo(() => {
    if (!pathname) return false;
    return exact ? pathname === href : pathname.startsWith(href);
  }, [pathname, href, exact]);

  const base = "px-3 py-2 text-sm font-medium rounded-md transition-all duration-200";
  const idle = "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)]";
  const active = "bg-[color:var(--muted)] text-[color:var(--foreground)]";

  return (
    <Link href={href} className={[base, isActive ? active : idle, className || ""].join(" ").trim()} aria-current={isActive ? "page" : undefined}>
      {children}
    </Link>
  );
}



"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        isActive ? "bg-accent-soft text-accent" : "text-muted hover:bg-accent-soft hover:text-accent"
      }`}
    >
      {label}
    </Link>
  );
}

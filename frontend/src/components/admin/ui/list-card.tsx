import Link from "next/link";
import type { ReactNode } from "react";

interface ListCardProps {
  href: string;
  title: ReactNode;
  meta?: ReactNode;
  pill?: ReactNode;
}

export function ListCard({ href, title, meta, pill }: ListCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3 shadow-sm transition-colors hover:border-accent"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {pill}
          <span className="truncate font-medium text-foreground">{title}</span>
        </div>
        {meta ? <p className="mt-1 truncate text-sm text-muted">{meta}</p> : null}
      </div>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className="h-4 w-4 shrink-0 text-muted"
      >
        <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

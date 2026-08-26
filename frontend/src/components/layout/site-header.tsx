import Link from "next/link";
import { platformPlaceholder } from "@/lib/platform-placeholder";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-serif text-xl font-medium tracking-tight text-foreground hover:text-accent transition-colors"
        >
          {platformPlaceholder.name}
        </Link>
        <nav aria-label="Principal" className="hidden sm:block">
          <Link
            href="/"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Artículos
          </Link>
        </nav>
      </div>
    </header>
  );
}

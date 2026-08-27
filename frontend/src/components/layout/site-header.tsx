import Link from "next/link";
import { getPlatformSettings } from "@/lib/api/client";

export async function SiteHeader() {
  const settings = await getPlatformSettings();
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-serif text-xl font-medium tracking-tight text-foreground hover:text-accent transition-colors"
        >
          {settings.shortName || settings.name}
        </Link>
        <div className="flex items-center gap-6">
          <nav aria-label="Principal" className="hidden sm:block">
            <Link
              href="/"
              className="text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Artículos
            </Link>
          </nav>
          <form action="/buscar" role="search" className="flex items-center">
            <label htmlFor="site-search" className="sr-only">
              Buscar artículos
            </label>
            <input
              id="site-search"
              type="search"
              name="q"
              placeholder="Buscar…"
              className="w-32 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none transition-[width] focus-visible:w-48 focus-visible:border-accent sm:w-40 sm:focus-visible:w-56"
            />
          </form>
        </div>
      </div>
    </header>
  );
}

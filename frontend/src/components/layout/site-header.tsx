import Link from "next/link";
import { getPlatformSettings, listActiveCategories } from "@/lib/api/client";
import { CategoryMenu } from "./category-menu";
import { MobileNav } from "./mobile-nav";
import { MobileSearch } from "./mobile-search";
import { NavLink } from "./nav-link";

export async function SiteHeader() {
  const [settings, categories] = await Promise.all([getPlatformSettings(), listActiveCategories()]);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          {settings.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- URL de logo definida por el usuario en Configuración, host arbitrario
            <img src={settings.logoUrl} alt="" className="h-8 w-auto" />
          )}
          <span className={settings.logoUrl ? "text-sm font-medium tracking-tight text-foreground" : "text-xl font-semibold tracking-tight text-foreground"}>
            {settings.name}
          </span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <nav aria-label="Principal" className="hidden items-center gap-4 sm:flex">
            <NavLink
              href="/"
              className="rounded-md px-2 py-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
              activeClassName="rounded-md px-2 py-3 text-sm font-semibold text-accent"
            >
              Inicio
            </NavLink>
            <CategoryMenu categories={categories} />
          </nav>
          <form action="/buscar" role="search" className="hidden items-center sm:flex">
            <label htmlFor="site-search" className="sr-only">
              Buscar contenido
            </label>
            <input
              id="site-search"
              type="search"
              name="q"
              placeholder="Buscar…"
              className="h-11 w-40 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder-muted outline-none transition-[width] focus-visible:w-56 focus-visible:border-accent"
            />
          </form>
          <MobileSearch />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

import Link from "next/link";
import { getPlatformSettings } from "@/lib/api/client";
import { MobileNav } from "./mobile-nav";

export async function SiteHeader() {
  const settings = await getPlatformSettings();
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex min-h-16 max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center text-xl font-semibold tracking-tight text-foreground hover:text-accent transition-colors"
        >
          {settings.logoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- URL de logo definida por el usuario en Configuración, host arbitrario */}
              <img
                src={settings.logoUrl}
                alt={settings.name}
                className={`h-8 w-auto ${settings.logoDarkUrl ? "logo-light" : ""}`}
              />
              {settings.logoDarkUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- ídem, variante oscura
                <img src={settings.logoDarkUrl} alt={settings.name} className="logo-dark h-8 w-auto" />
              )}
            </>
          ) : (
            settings.shortName || settings.name
          )}
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <nav aria-label="Principal" className="hidden items-center gap-4 sm:flex">
            <Link
              href="/"
              className="rounded-md px-2 py-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Inicio
            </Link>
            <Link
              href="/categorias"
              className="rounded-md px-2 py-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Categorías
            </Link>
          </nav>
          <form action="/buscar" role="search" className="flex items-center">
            <label htmlFor="site-search" className="sr-only">
              Buscar contenido
            </label>
            <input
              id="site-search"
              type="search"
              name="q"
              placeholder="Buscar…"
              className="h-11 w-28 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-[width] focus-visible:w-44 focus-visible:border-accent sm:w-40 sm:focus-visible:w-56"
            />
          </form>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

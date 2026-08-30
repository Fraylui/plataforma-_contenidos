import Link from "next/link";
import { getPlatformSettings, listActiveCategories } from "@/lib/api/client";
import { CategoryMenu } from "./category-menu";
import { MobileNav } from "./mobile-nav";
import { MobileSearch } from "./mobile-search";
import { NavLink } from "./nav-link";

export async function SiteHeader() {
  const [settings, categories] = await Promise.all([getPlatformSettings(), listActiveCategories()]);
  return (
    <header
      className="sticky top-0 z-40 text-background shadow-md"
      style={
        {
          background:
            "radial-gradient(130% 180% at 100% 0%, var(--accent) 0%, transparent 42%), " +
            "radial-gradient(100% 160% at 0% 120%, rgba(255,255,255,0.05) 0%, transparent 55%), " +
            "#0d0d0d",
          // Header siempre oscuro (marca fija), sin importar si el sitio está
          // en modo claro u oscuro (Tema en Configuración) — se sobreescriben
          // acá las variables que usan las clases de los hijos (text-background,
          // bg-background/10, etc.) para que no se inviertan con el tema del sitio.
          "--background": "#f5f5f5",
          "--foreground": "#0d0d0d",
        } as React.CSSProperties
      }
    >
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          {(settings.logoDarkUrl || settings.logoUrl) && (
            // eslint-disable-next-line @next/next/no-img-element -- URL de logo definida por el usuario en Configuración, host arbitrario
            <img src={settings.logoDarkUrl || settings.logoUrl!} alt="" className="h-8 w-auto" />
          )}
          <span className={settings.logoUrl ? "text-sm font-medium tracking-tight" : "text-xl font-semibold tracking-tight"}>
            {settings.name}
          </span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <nav aria-label="Principal" className="hidden items-center gap-4 sm:flex">
            <NavLink
              href="/"
              className="rounded-md px-2 py-3 text-sm font-medium text-background/75 transition-colors hover:text-background"
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
              className="h-11 w-40 rounded-md border border-background/25 bg-background/10 px-3 text-sm text-background placeholder-background/50 outline-none transition-[width] focus-visible:w-56 focus-visible:border-accent"
            />
          </form>
          <MobileSearch />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

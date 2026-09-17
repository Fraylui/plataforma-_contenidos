import Link from "next/link";
import { getPlatformSettings, getPrimaryNavVisibility, listActiveCategories } from "@/lib/api/client";
import { CategoryMenu } from "./category-menu";
import { MobileNav } from "./mobile-nav";
import { SearchBox } from "./search-box";
import { NavLink } from "./nav-link";

const NAV_LINK = "shrink-0 rounded-md px-2.5 py-2 text-sm font-medium whitespace-nowrap transition-colors";

// Mismo orden que MobileNav (LINKS) — es el mismo menú, en dos formatos.
// Sin íconos en escritorio (a diferencia de una versión anterior): con los
// 6 enlaces + logo + buscador + categorías, el header no entraba en varios
// anchos de laptop comunes (1024-1366px) y el nav cambiaba a scroll
// horizontal — texto solo ahorra el espacio suficiente para que quepan
// todos sin recortarse.
const PRIMARY_LINKS: { href: string; label: string; wide?: boolean }[] = [
  { href: "/", label: "Inicio" },
  { href: "/publicaciones", label: "Publicaciones" },
  { href: "/lugares", label: "Lugares" },
  { href: "/eventos", label: "Eventos" },
  { href: "/galerias", label: "Galerías", wide: true },
  { href: "/directorio", label: "Directorio", wide: true },
];

export async function SiteHeader() {
  const [settings, categories, visibility] = await Promise.all([
    getPlatformSettings(),
    listActiveCategories(),
    getPrimaryNavVisibility(),
  ]);
  const categoryNames: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  // Un módulo sin contenido publicado todavía no aparece en la navegación —
  // un enlace a una página vacía confunde más de lo que ayuda.
  const visibleLinks = PRIMARY_LINKS.filter((link) => link.href === "/" || visibility[link.href]);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-x-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80">
          {settings.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- URL de logo definida por el usuario en Configuración, host arbitrario
            <img src={settings.logoUrl} alt="" className="h-8 w-auto" />
          )}
          <span className={settings.logoUrl ? "text-sm font-medium tracking-tight text-foreground" : "text-xl font-semibold tracking-tight text-foreground"}>
            {settings.name}
          </span>
        </Link>
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {/* Nunca hace scroll horizontal: por debajo de xl (1280px) directamente
              no se muestra el nav en línea, se usa el menú hamburguesa (Sheet) —
              mismo patrón que shadcn/Radix NavigationMenu recomiendan para
              overflow: colapsar a un menú, nunca deslizar la barra (encontramos
              un caso real roto a 1358px con la versión anterior que sí
              intentaba entrar todo con scroll). A xl+ ya sobra espacio de sobra
              para los 6 enlaces + categorías + buscador sin apretar nada. */}
          <nav aria-label="Principal" className="hidden items-center gap-0.5 xl:flex">
            {visibleLinks.map(({ href, label, wide }) => (
              <NavLink
                key={href}
                href={href}
                className={`${NAV_LINK} text-muted hover:bg-canvas hover:text-foreground ${wide ? "hidden 2xl:inline-block" : ""}`}
                activeClassName={`${NAV_LINK} font-semibold text-accent ${wide ? "hidden 2xl:inline-block" : ""}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden shrink-0 xl:block">
            <CategoryMenu categories={categories} />
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <SearchBox variant="desktop" categoryNames={categoryNames} />
            <SearchBox variant="mobile" categoryNames={categoryNames} />
            <MobileNav links={visibleLinks.map(({ href, label }) => ({ href, label }))} categories={categories} />
          </div>
        </div>
      </div>
    </header>
  );
}

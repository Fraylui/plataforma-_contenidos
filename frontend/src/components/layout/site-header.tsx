import Link from "next/link";
import { getPlatformSettings, getPrimaryNavVisibility, listActiveCategories } from "@/lib/api/client";
import type { SearchResultType } from "@/lib/api/types";
import { CategoryMenu } from "./category-menu";
import { MobileNav } from "./mobile-nav";
import { SearchBox, type SearchScope } from "./search-box";
import { NavLink } from "./nav-link";

const NAV_LINK = "relative shrink-0 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors";

// Mismo orden que MobileNav (LINKS) — es el mismo menú, en dos formatos.
// `scope`: a qué tipo del buscador corresponde el módulo (selector "Buscar en").
const PRIMARY_LINKS: { href: string; label: string; scope?: SearchResultType }[] = [
  { href: "/", label: "Inicio" },
  { href: "/publicaciones", label: "Publicaciones", scope: "ARTICLE" },
  { href: "/lugares", label: "Lugares", scope: "PLACE" },
  { href: "/eventos", label: "Eventos", scope: "EVENT" },
  { href: "/galerias", label: "Galerías", scope: "GALLERY" },
  { href: "/directorio", label: "Directorio", scope: "BUSINESS" },
];

/**
 * Header en dos franjas (patrón de AliExpress/Amazon/MSN: cada franja con un
 * solo trabajo):
 *  1. Marca + buscador ancho al centro — buscar es lo primero que hace
 *     quien llega con algo concreto en mente, así que ocupa el espacio
 *     principal, con selector "Buscar en" para acotar a un módulo.
 *  2. Navegación: "Categorías" + los módulos, TODOS visibles desde 1024px.
 *     Antes compartían una sola franja con el logo y el buscador y no
 *     entraban: Galerías y Directorio quedaban ocultos hasta 1536px, o sea
 *     invisibles en casi cualquier laptop.
 * Debajo de 1024px la segunda franja pasa al menú hamburguesa (MobileNav).
 */
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
  const scopes: SearchScope[] = [
    { value: "", label: "Todo" },
    ...visibleLinks.flatMap((link) => (link.scope ? [{ value: link.scope, label: link.label }] : [])),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:gap-6 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80">
          {settings.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- URL de logo definida por el usuario en Configuración, host arbitrario
            <img src={settings.logoUrl} alt="" className="h-8 w-auto" />
          )}
          <span className={settings.logoUrl ? "text-sm font-medium tracking-tight text-foreground" : "text-xl font-semibold tracking-tight text-foreground"}>
            {settings.name}
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 justify-end sm:justify-center">
          <div className="hidden w-full max-w-2xl sm:block">
            <SearchBox variant="desktop" categoryNames={categoryNames} scopes={scopes} />
          </div>
          <div className="flex items-center gap-1 sm:hidden">
            <SearchBox variant="mobile" categoryNames={categoryNames} />
          </div>
        </div>

        <div className="shrink-0 lg:hidden">
          <MobileNav links={visibleLinks.map(({ href, label }) => ({ href, label }))} categories={categories} />
        </div>
      </div>

      <div className="hidden border-t border-border/70 lg:block">
        <div className="mx-auto flex h-11 max-w-7xl items-center gap-1 px-4 sm:px-6 lg:px-8">
          {categories.length > 0 && (
            <>
              <CategoryMenu categories={categories} />
              <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />
            </>
          )}
          <nav aria-label="Principal" className="flex items-center gap-0.5">
            {visibleLinks.map(({ href, label }) => (
              <NavLink
                key={href}
                href={href}
                className={`${NAV_LINK} text-muted hover:bg-canvas hover:text-foreground`}
                activeClassName={`${NAV_LINK} font-semibold text-accent after:absolute after:inset-x-3 after:-bottom-[5px] after:h-0.5 after:rounded-full after:bg-accent-fill`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <Link
            href="/contacto"
            className="ml-auto shrink-0 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-canvas hover:text-foreground"
          >
            Contacto
          </Link>
        </div>
      </div>
    </header>
  );
}

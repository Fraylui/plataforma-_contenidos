import Link from "next/link";
import { CalendarDays, FileText, Home, Images, MapPin, Star, Store, type LucideIcon } from "lucide-react";
import { getPlatformSettings, listActiveCategories } from "@/lib/api/client";
import { CategoryMenu } from "./category-menu";
import { MobileNav } from "./mobile-nav";
import { SearchBox } from "./search-box";
import { NavLink } from "./nav-link";

const NAV_LINK = "inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm transition-colors";

// Mismo orden que MobileNav (LINKS) — es el mismo menú, en dos formatos.
const PRIMARY_LINKS: { href: string; label: string; icon: LucideIcon; wide?: boolean }[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/publicaciones", label: "Publicaciones", icon: FileText },
  { href: "/lugares", label: "Lugares", icon: MapPin },
  { href: "/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/galerias", label: "Galerías", icon: Images, wide: true },
  { href: "/resenas", label: "Reseñas", icon: Star, wide: true },
  { href: "/directorio", label: "Directorio", icon: Store, wide: true },
];

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
          {/* Enlaces de módulo con ícono (antes solo existían en el menú mobile:
              en escritorio Lugares/Eventos eran inalcanzables sin pasar por
              Categorías). Los 3 principales siempre; Galerías/Reseñas/Directorio
              solo desde lg para no saturar el header en tablet. */}
          <nav aria-label="Principal" className="hidden items-center gap-1 sm:flex">
            {PRIMARY_LINKS.map(({ href, label, icon: Icon, wide }) => (
              <NavLink
                key={href}
                href={href}
                className={`${NAV_LINK} text-muted hover:text-foreground ${wide ? "hidden lg:inline-flex" : ""}`}
                activeClassName={`${NAV_LINK} font-semibold text-accent ${wide ? "hidden lg:inline-flex" : ""}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
            <CategoryMenu categories={categories} />
          </nav>
          <SearchBox variant="desktop" />
          <SearchBox variant="mobile" />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

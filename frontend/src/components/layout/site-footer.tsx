import Link from "next/link";
import { ArrowUp, BookOpen, Building2, CalendarDays, Images, Mail, MapPin, Rss } from "lucide-react";
import {
  getPlatformSettings,
  getPrimaryNavVisibility,
  listActiveCategories,
  listPublishedArticles,
  listPublishedEvents,
  listPublishedGalleries,
} from "@/lib/api/client";
import { formatEventDateTime } from "@/lib/content-labels";

const EXPLORE_LINKS = [
  { href: "/publicaciones", label: "Publicaciones", Icon: BookOpen },
  { href: "/lugares", label: "Lugares", Icon: MapPin },
  { href: "/eventos", label: "Eventos", Icon: CalendarDays },
  { href: "/galerias", label: "Galerías", Icon: Images },
  { href: "/directorio", label: "Directorio", Icon: Building2 },
];

// Todas las categorías raíz (con tope de seguridad): son enlaces internos a
// páginas reales — ayudan a navegar y a que Google descubra cada sección.
const FOOTER_CATEGORIES_MAX = 24;
const THIS_WEEK_MAX = 3;

const headingClass = "text-xs font-semibold tracking-wider text-muted uppercase";
const linkClass = "inline-flex min-h-9 items-center text-sm text-muted transition-colors hover:text-accent";

/**
 * Pie de página en tres franjas (patrón de los pies de Amazon y MSN):
 *  1. Cuatro columnas cortas y parejas: marca, Explorar, Esta semana, Ayuda.
 *  2. Temas: todas las categorías como enlaces de texto en línea, a todo el
 *     ancho — 2-3 renglones en escritorio.
 *  3. Barra final con el copyright.
 * Antes las 23 categorías eran píldoras apiladas dentro de la primera
 * columna (511px de alto) mientras las otras tres tenían ~200px de
 * contenido: quedaban ~300px vacíos debajo de cada una. Además una marca de
 * agua gigante con el nombre del sitio se montaba sobre el copyright.
 * Respeta el tema claro/oscuro como el resto del sitio.
 */
export async function SiteFooter() {
  const [settings, categories, latestArticles, latestGalleries, nextEvents, visibility] = await Promise.all([
    getPlatformSettings(),
    listActiveCategories(),
    listPublishedArticles({ size: 2 }),
    listPublishedGalleries({ size: 1 }),
    listPublishedEvents({ when: "upcoming", size: 1 }),
    getPrimaryNavVisibility(),
  ]);
  const exploreLinks = EXPLORE_LINKS.filter((link) => visibility[link.href]);
  const year = new Date().getFullYear();
  const rootCategories = categories
    .filter((category) => category.parentId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .slice(0, FOOTER_CATEGORIES_MAX);
  // El footer respeta el tema, así que el logo también cambia de variante
  // con .logo-light/.logo-dark (mismo patrón que globals.css ya define):
  // un logo claro sobre fondo transparente sería invisible en tema claro.
  const lightLogo = settings.logoUrl;
  const darkLogo = settings.logoDarkUrl || settings.logoUrl;
  const hasLogoVariants = Boolean(lightLogo && darkLogo && lightLogo !== darkLogo);

  const thisWeek = [
    ...nextEvents.items.map((e) => ({
      id: e.id,
      href: `/eventos/${e.slug}`,
      kicker: `Evento · ${formatEventDateTime(e.startsAt)}`,
      title: e.title,
      highlight: true,
    })),
    ...latestArticles.items.map((a) => ({ id: a.id, href: `/publicaciones/${a.slug}`, kicker: "Publicación", title: a.title, highlight: false })),
    ...latestGalleries.items.map((g) => ({ id: g.id, href: `/galerias/${g.slug}`, kicker: "Galería", title: g.title, highlight: false })),
  ].slice(0, THIS_WEEK_MAX);

  return (
    <footer className="border-t-2 border-accent bg-canvas-strong">
      {/* Franja de lado a lado (patrón Amazon): al terminar un scroll largo, volver
          arriba es lo que más se busca — un enlace chico al pie no se encontraba. */}
      <a
        href="#top"
        className="flex items-center justify-center gap-2 border-b border-border bg-surface/60 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent-soft hover:text-accent"
      >
        <ArrowUp className="h-4 w-4" aria-hidden="true" />
        Volver arriba
      </a>

      <div className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6 lg:px-8">
        {/* Celular: marca arriba, Explorar | Ayuda lado a lado, Esta semana abajo.
            Escritorio: las cuatro en una fila. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.3fr_1fr_1.3fr_1fr] lg:gap-x-10">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80">
              {hasLogoVariants ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL de logo definida por el usuario en Configuración, host arbitrario */}
                  <img src={lightLogo!} alt="" className="logo-light h-8 w-auto" />
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL de logo definida por el usuario en Configuración, host arbitrario */}
                  <img src={darkLogo!} alt="" className="logo-dark h-8 w-auto" />
                </>
              ) : lightLogo || darkLogo ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL de logo definida por el usuario en Configuración, host arbitrario
                <img src={lightLogo || darkLogo!} alt="" className="h-8 w-auto" />
              ) : (
                <span className="h-2.5 w-2.5 rounded-full bg-accent-fill ring-4 ring-accent/20" aria-hidden="true" />
              )}
              <span className="text-xl font-bold tracking-tight text-foreground">{settings.name}</span>
            </Link>
            {settings.description && (
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">{settings.description}</p>
            )}
            {settings.contactEmail && (
              <a
                href={`mailto:${settings.contactEmail}?subject=${encodeURIComponent("Propuesta de contenido")}`}
                className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-accent-fill px-4 text-[13px] font-semibold text-accent-foreground transition-opacity hover:opacity-90"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                Proponer contenido
              </a>
            )}
          </div>

          {exploreLinks.length > 0 && (
            <nav aria-label="Explorar">
              <h2 className={headingClass}>Explorar</h2>
              <ul className="mt-3">
                {exploreLinks.map(({ href, label, Icon }) => (
                  <li key={href}>
                    <Link href={href} className={`${linkClass} gap-2`}>
                      <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {thisWeek.length > 0 && (
            <div className="col-span-2 row-start-3 lg:col-span-1 lg:row-start-auto">
              <h2 className={headingClass}>Esta semana</h2>
              <ul className="mt-3 space-y-3">
                {thisWeek.map((entry) => (
                  <li key={entry.id} className={`border-l-2 pl-3 ${entry.highlight ? "border-accent" : "border-border"}`}>
                    <Link href={entry.href} className="group flex flex-col gap-0.5">
                      <span className={`text-[11px] font-semibold tracking-wider uppercase ${entry.highlight ? "text-accent" : "text-muted"}`}>
                        {entry.kicker}
                      </span>
                      <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
                        {entry.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <nav aria-label="Ayuda">
            <h2 className={headingClass}>Ayuda</h2>
            <ul className="mt-3">
              <li>
                <Link href="/contacto" className={linkClass}>
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className={linkClass}>
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className={linkClass}>
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link href="/rss.xml" className={`${linkClass} gap-1.5`}>
                  <Rss className="h-3.5 w-3.5" aria-hidden="true" />
                  RSS
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {rootCategories.length > 0 && (
          <nav aria-label="Temas" className="mt-10 border-t border-border pt-6">
            <h2 className={headingClass}>Temas</h2>
            <ul className="mt-2 flex flex-wrap items-center text-sm">
              {rootCategories.map((category, index) => (
                <li key={category.id} className="flex items-center">
                  <Link
                    href={`/categorias/${category.slug}`}
                    className="inline-flex min-h-9 items-center px-1.5 text-muted transition-colors hover:text-accent"
                  >
                    {category.name}
                  </Link>
                  {index < rootCategories.length - 1 && (
                    <span className="text-muted/50" aria-hidden="true">
                      ·
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="mt-6 border-t border-border pt-5 text-xs text-muted">
          <p>
            © {year} {settings.name}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { ArrowRight, ArrowUp, BookOpen, Building2, CalendarDays, Images, Mail, MapPin, Star } from "lucide-react";
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
  { href: "/resenas", label: "Reseñas", Icon: Star },
  { href: "/directorio", label: "Directorio", Icon: Building2 },
];

const FOOTER_CATEGORIES_MAX = 6;
const THIS_WEEK_MAX = 3;

const headingClass = "text-xs font-semibold tracking-wider text-muted uppercase";

/**
 * Respeta el tema claro/oscuro como el resto del sitio (--background/
 * --surface/--accent) — antes era siempre oscuro a propósito, pero en tema
 * claro quedaba desentonado con el resto de la página. El wordmark gigante
 * de fondo escala su tamaño según la longitud del nombre configurado (antes
 * un tamaño fijo lo recortaba en los bordes con nombres largos, quedando
 * "cortado" en vez de legible como textura decorativa).
 *
 * Además de navegación, muestra "Esta semana" (lo último publicado + el
 * próximo evento) para que el pie no sea un bloque muerto de enlaces.
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
  // El footer respeta el tema (ya no es siempre oscuro), así que el logo
  // también debe cambiar de variante con .logo-light/.logo-dark (mismo
  // patrón que globals.css ya define) — antes se fijaba logoDarkUrl siempre,
  // que sobre un footer claro queda invisible si es un logo claro sobre
  // fondo transparente.
  const lightLogo = settings.logoUrl;
  const darkLogo = settings.logoDarkUrl || settings.logoUrl;
  const hasLogoVariants = Boolean(lightLogo && darkLogo && lightLogo !== darkLogo);
  const watermark = (settings.shortName || settings.name).toUpperCase();
  // Entre más largo el nombre, más chico el tamaño para que siga entrando
  // en una sola línea sin recortarse contra los bordes del viewport.
  const watermarkVw = Math.min(15, Math.max(5, 155 / watermark.length));

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
    <footer className="relative overflow-hidden border-t-2 border-accent bg-canvas-strong">
      <span
        aria-hidden="true"
        style={{ fontSize: `clamp(40px, ${watermarkVw}vw, 220px)` }}
        className="pointer-events-none absolute bottom-[-0.08em] left-1/2 -translate-x-1/2 leading-none font-bold tracking-tighter whitespace-nowrap text-accent/[0.09] select-none"
      >
        {watermark}
      </span>

      <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6 sm:pt-14 lg:px-8">
        <div
          className={`grid grid-cols-1 gap-10 sm:grid-cols-2 ${
            exploreLinks.length > 0 && thisWeek.length > 0
              ? "lg:grid-cols-[1.4fr_1fr_1fr_1fr]"
              : exploreLinks.length > 0 || thisWeek.length > 0
                ? "lg:grid-cols-[1.4fr_1fr_1fr]"
                : "lg:grid-cols-[1.4fr_1fr]"
          }`}
        >
          <div className="sm:col-span-2 lg:col-span-1">
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
                <span className="h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-accent/20" aria-hidden="true" />
              )}
              <span className="text-xl font-bold tracking-tight text-foreground">{settings.name}</span>
            </Link>
            {settings.description && (
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted">{settings.description}</p>
            )}
            {rootCategories.length > 0 && (
              <nav aria-label="Categorías" className="mt-5 flex flex-wrap gap-2">
                {rootCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categorias/${category.slug}`}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-[0_1px_2px_rgb(0_0_0_/_0.08)] transition-colors hover:border-accent/60 hover:text-accent"
                  >
                    {category.name}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {exploreLinks.length > 0 && (
          <nav aria-label="Explorar">
            <h2 className={headingClass}>Explorar</h2>
            <ul className="mt-4 space-y-2">
              {exploreLinks.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link href={href} className="group inline-flex items-center gap-2.5 py-0.5 text-sm text-muted transition-colors hover:text-foreground">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-accent shadow-[0_1px_2px_rgb(0_0_0_/_0.08)] transition-colors group-hover:border-accent/50 group-hover:bg-accent-soft">
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          )}

          {thisWeek.length > 0 && (
            <div>
              <h2 className={headingClass}>Esta semana</h2>
              <ul className="mt-4 space-y-3.5">
                {thisWeek.map((entry) => (
                  <li key={entry.id} className={`border-l-2 pl-3 ${entry.highlight ? "border-accent" : "border-border"}`}>
                    <Link href={entry.href} className="group flex flex-col gap-1">
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

          <div>
            {settings.contactEmail && (
              <>
                <h2 className={headingClass}>Contacto</h2>
                <address className="mt-4 block rounded-2xl border border-border bg-background p-4 not-italic">
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="inline-flex items-center gap-2 text-sm break-all text-foreground transition-colors hover:text-accent"
                  >
                    <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {settings.contactEmail}
                  </a>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">
                    ¿Tienes un lugar, evento o historia que deberíamos cubrir? Escríbenos.
                  </p>
                  <a
                    href={`mailto:${settings.contactEmail}?subject=${encodeURIComponent("Propuesta de contenido")}`}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-accent-foreground transition-colors hover:opacity-90"
                  >
                    Proponer contenido
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </address>
              </>
            )}
            <nav aria-label="Legal" className={settings.contactEmail ? "mt-6" : ""}>
              <h2 className={headingClass}>Legal</h2>
              <ul className="mt-4 space-y-0.5">
                <li>
                  <Link href="/privacidad" className="inline-block py-1.5 text-sm text-muted transition-colors hover:text-accent">
                    Política de privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/terminos" className="inline-block py-1.5 text-sm text-muted transition-colors hover:text-accent">
                    Términos y condiciones
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.name}. Todos los derechos reservados.
          </p>
          <a href="#top" className="inline-flex w-fit items-center gap-1.5 py-1 text-muted transition-colors hover:text-foreground">
            Volver arriba
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}

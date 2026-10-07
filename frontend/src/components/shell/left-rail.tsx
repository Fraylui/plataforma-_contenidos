"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Buildings, CaretDown, ImagesSquare, MapPin, Notepad, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { TopicStory } from "@/components/feed/topic-stories";
import { InfoMenu } from "./info-menu";
import { SearchDrawer } from "./search-drawer";
import { MORE_LINKS, activeTab, visibleNav } from "./shell-nav";

export interface ShellBrand {
  name: string;
  logoUrl: string | null;
}

/**
 * Secciones con su color, como los accesos de Facebook (Amigos azul,
 * Recuerdos celeste, Guardado violeta…): un círculo de color con el ícono
 * en blanco se reconoce de un vistazo, también en el modo de solo íconos.
 * El blanco sobre estos tonos 600 cumple contraste en claro y oscuro.
 */
const SECTIONS: { href: string; label: string; icon: Icon; tile: string }[] = [
  { href: "/publicaciones", label: "Publicaciones", icon: Notepad, tile: "bg-linear-to-br from-sky-500 to-blue-600" },
  { href: "/lugares", label: "Lugares", icon: MapPin, tile: "bg-linear-to-br from-emerald-500 to-teal-600" },
  { href: "/galerias", label: "Galerías", icon: ImagesSquare, tile: "bg-linear-to-br from-fuchsia-500 to-pink-600" },
  { href: "/directorio", label: "Directorio", icon: Buildings, tile: "bg-linear-to-br from-amber-500 to-orange-600" },
];
/** Temas visibles antes de "Ver más" (como los accesos directos de Facebook): el menú cabe en pantalla sin barra de desplazamiento. */
const VISIBLE_TOPICS = 5;

/**
 * Fila del riel: píldora de fondo al pasar el mouse, ícono que crece un 5 %
 * y se hunde al presionar (como Instagram/X); sin movimiento si el sistema
 * pide reducirlo.
 */
const ITEM =
  "group relative flex min-h-12 w-full cursor-pointer items-center gap-4 rounded-2xl px-3 text-base transition-[background-color,color,transform] hover:bg-canvas motion-safe:active:scale-[0.97]";
const ITEM_ICON = "shrink-0 transition-transform motion-safe:group-hover:scale-105";
const HEADING = "mb-1 hidden px-3 text-[15px] font-bold text-foreground xl:block";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Etiqueta flotante del modo solo íconos (1024–1279 px), al pasar el mouse
 * o al llegar con el teclado. Decorativa: el enlace ya tiene aria-label.
 */
function RailTooltip({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded-lg bg-foreground px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 xl:hidden"
    >
      {label}
    </span>
  );
}

function agendaLabel(count: number) {
  if (count <= 0) return "Agenda";
  return `Agenda, ${count} ${count === 1 ? "evento" : "eventos"} esta semana`;
}

/**
 * Columna de navegación izquierda (escritorio, ≥ 1024 px), con el lenguaje
 * de Instagram, Facebook y X:
 * - marca grande arriba (como el logotipo de Instagram);
 * - navegación principal con íconos grandes, el activo relleno y en una
 *   píldora; "Buscar" abre un panel lateral y Agenda lleva el contador de
 *   la semana;
 * - Secciones con círculos de color (accesos de Facebook);
 * - Temas con su foto en el anillo de historia de Instagram y "Novedades"
 *   a la vista cuando hay contenido nuevo;
 * - al pie, los enlaces legales a la vista, como el pie de la columna de
 *   Facebook — nada escondido detrás de un ícono que no dice qué hace.
 * Claro u oscuro según el dispositivo (prefers-color-scheme), sin selector.
 * Solo íconos de 1024 a 1279 px (con etiquetas flotantes e "Información");
 * completo desde 1280 px. Sin líneas: la separación es el espacio y el
 * color de fondo.
 */
export function LeftRail({
  brand,
  showAgenda,
  sections = {},
  topics = [],
  agendaCount = 0,
  categoryNames = {},
}: {
  brand: ShellBrand;
  showAgenda: boolean;
  /** Qué secciones tienen contenido (getPrimaryNavVisibility). */
  sections?: Record<string, boolean>;
  topics?: TopicStory[];
  /** Eventos de los próximos 7 días (countThisWeek), calculado en el servidor. */
  agendaCount?: number;
  /** Nombres de temas para las sugerencias del panel de búsqueda. */
  categoryNames?: Record<string, string>;
}) {
  const pathname = usePathname();
  const current = activeTab(pathname);
  const visibleSections = SECTIONS.filter((s) => sections[s.href]);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const shownTopics = showAllTopics ? topics : topics.slice(0, VISIBLE_TOPICS);
  const year = new Date().getFullYear();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col bg-surface px-3 pt-6 pb-4 lg:flex xl:w-[17.5rem]">
      <Link
        href="/"
        className="mb-6 flex items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors hover:bg-canvas"
        aria-label={brand.name}
      >
        {brand.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo definido en Configuración, host arbitrario
          <img src={brand.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-xl object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-fill text-base font-black text-accent-foreground"
          >
            {brand.name.charAt(0)}
          </span>
        )}
        <span className="hidden truncate text-xl font-black tracking-tight text-foreground xl:block">{brand.name}</span>
      </Link>

      {/* Desplazable solo con etiquetas (≥ 1280 px): en el modo de íconos el menú cabe y las etiquetas flotantes deben poder salir de la columna. Sin barra visible (como Facebook/Instagram). */}
      <div className="-mx-1 flex min-h-0 flex-1 flex-col px-1 no-scrollbar xl:overflow-y-auto">
        <nav aria-label="Principal" className="flex flex-col gap-1">
          {visibleNav(showAgenda).map(({ tab, href, label, icon: NavIcon }) => {
            const active = tab === current && !visibleSections.some((s) => isActive(pathname, s.href));
            const className = cn(ITEM, active ? "bg-canvas font-bold text-foreground" : "font-medium text-foreground/80 hover:text-foreground");
            const icon = <NavIcon className={cn(ITEM_ICON, "h-[26px] w-[26px]")} weight={active ? "fill" : "regular"} aria-hidden="true" />;
            if (tab === "buscar") {
              return (
                <SearchDrawer
                  key={tab}
                  categoryNames={categoryNames}
                  trigger={
                    <button type="button" aria-label={label} className={className}>
                      {icon}
                      <span className="hidden xl:inline">{label}</span>
                      <RailTooltip label={label} />
                    </button>
                  }
                />
              );
            }
            const count = tab === "agenda" ? agendaCount : 0;
            return (
              <Link
                key={tab}
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={tab === "agenda" ? agendaLabel(count) : label}
                className={className}
              >
                <span className="relative shrink-0">
                  {icon}
                  {count > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1.5 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] leading-none font-bold text-white ring-2 ring-surface"
                    >
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                <span className="hidden xl:inline">{label}</span>
                <RailTooltip label={label} />
              </Link>
            );
          })}
        </nav>

        {visibleSections.length > 0 && (
          <nav aria-label="Secciones" className="mt-6 flex flex-col gap-0.5">
            <p className={HEADING}>Secciones</p>
            {visibleSections.map(({ href, label, icon: SectionIcon, tile }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  aria-label={label}
                  className={cn(ITEM, "gap-3 px-2", active ? "bg-canvas font-bold text-foreground" : "font-medium text-foreground/80 hover:text-foreground")}
                >
                  <span className={cn(ITEM_ICON, "flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm", tile)}>
                    <SectionIcon className="h-5 w-5" weight="fill" aria-hidden="true" />
                  </span>
                  <span className="hidden xl:inline">{label}</span>
                  <RailTooltip label={label} />
                </Link>
              );
            })}
          </nav>
        )}

        {topics.length > 0 && (
          <nav aria-label="Temas del menú" className="mt-6 hidden flex-col gap-0.5 xl:flex">
            <p className={HEADING}>Temas</p>
            {shownTopics.map((topic) => {
              const href = `/categorias/${topic.slug}`;
              const active = isActive(pathname, href);
              return (
                <Link
                  key={topic.categoryId}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(ITEM, "gap-3 px-2", active ? "bg-canvas text-foreground" : "text-foreground/80 hover:text-foreground")}
                >
                  {/* Anillo de historia de Instagram: degradado de marca si hay novedades, gris si no. */}
                  <span
                    className={cn(
                      ITEM_ICON,
                      "rounded-full p-[2px]",
                      topic.hasNew ? "bg-linear-to-tr from-accent-fill via-emerald-400 to-lime-300" : "bg-border",
                    )}
                  >
                    <span className="block rounded-full bg-surface p-[2px]">
                      {topic.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- miniatura de 32 px
                        <img src={topic.coverUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-black text-accent">
                          {topic.name.charAt(0)}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className={cn("truncate text-[15px]", active ? "font-bold" : "font-medium")}>{topic.name}</span>
                    {topic.hasNew && <span className="text-xs font-semibold text-accent">Novedades</span>}
                  </span>
                </Link>
              );
            })}
            {topics.length > VISIBLE_TOPICS && (
              <button
                type="button"
                onClick={() => setShowAllTopics((v) => !v)}
                aria-expanded={showAllTopics}
                aria-label={showAllTopics ? "Ver menos temas" : "Ver más temas"}
                className={cn(ITEM, "gap-3 px-2 font-medium text-foreground/80 hover:text-foreground")}
              >
                <span className={cn(ITEM_ICON, "flex h-10 w-10 items-center justify-center rounded-full bg-canvas-strong")}>
                  <CaretDown className={cn("h-5 w-5 transition-transform", showAllTopics && "rotate-180")} weight="bold" aria-hidden="true" />
                </span>
                <span className="text-[15px]">{showAllTopics ? "Ver menos" : "Ver más"}</span>
              </button>
            )}
          </nav>
        )}
      </div>

      {/* Pie a la vista desde 1280 px, como la columna de Facebook: enlaces legales. */}
      <div className="mt-4 hidden px-1 xl:block">
        <footer className="px-2 text-xs leading-relaxed text-muted">
          <nav aria-label="Legal" className="flex flex-wrap gap-x-1">
            {MORE_LINKS.map((link, i) => (
              <span key={link.href}>
                <Link href={link.href} className="hover:text-foreground hover:underline">
                  {link.label}
                </Link>
                {i < MORE_LINKS.length - 1 && <span aria-hidden="true"> · </span>}
              </span>
            ))}
          </nav>
          <p className="mt-1">
            © {year} {brand.name}
          </p>
        </footer>
      </div>

      {/* Modo solo íconos (1024–1279 px): los enlaces legales detrás de "Información". */}
      <div className="mt-3 xl:hidden">
        <InfoMenu brandName={brand.name} triggerClassName={cn(ITEM, "font-medium text-foreground/80 hover:text-foreground data-[state=open]:bg-canvas")}>
          <RailTooltip label="Información" />
        </InfoMenu>
      </div>
    </aside>
  );
}

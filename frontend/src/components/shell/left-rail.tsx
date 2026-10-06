"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Buildings, ImagesSquare, MapPin, Notepad, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { TopicStory } from "@/components/feed/topic-stories";
import { MORE_LINKS, activeTab, visibleNav } from "./shell-nav";

export interface ShellBrand {
  name: string;
  logoUrl: string | null;
}

const SECTIONS: { href: string; label: string; icon: Icon }[] = [
  { href: "/publicaciones", label: "Publicaciones", icon: Notepad },
  { href: "/lugares", label: "Lugares", icon: MapPin },
  { href: "/galerias", label: "Galerías", icon: ImagesSquare },
  { href: "/directorio", label: "Directorio", icon: Buildings },
];
const MAX_TOPICS = 8;

const ITEM = "flex min-h-11 items-center gap-4 rounded-xl px-3 text-[15px] transition-colors hover:bg-canvas";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Columna de navegación izquierda (escritorio, ≥ 1024 px), como Facebook o
 * X: navegación principal, secciones con contenido y temas con su foto
 * (punto verde = novedades), así la columna no queda vacía. Solo íconos de
 * 1024 a 1279 px; con etiquetas, secciones y temas desde 1280 px. Sin
 * línea al costado: la separación es el color de fondo. Al pie, los
 * enlaces legales.
 */
export function LeftRail({
  brand,
  showAgenda,
  sections = {},
  topics = [],
}: {
  brand: ShellBrand;
  showAgenda: boolean;
  /** Qué secciones tienen contenido (getPrimaryNavVisibility). */
  sections?: Record<string, boolean>;
  topics?: TopicStory[];
}) {
  const pathname = usePathname();
  const current = activeTab(pathname);
  const year = new Date().getFullYear();
  const visibleSections = SECTIONS.filter((s) => sections[s.href]);

  return (
    <aside className="sticky top-0 hidden h-dvh w-[72px] shrink-0 flex-col bg-surface px-3 py-5 lg:flex xl:w-64">
      <Link href="/" className="mb-6 flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-canvas" aria-label={brand.name}>
        {brand.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo definido en Configuración, host arbitrario
          <img src={brand.logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
        ) : (
          <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-fill text-sm font-black text-accent-foreground">
            {brand.name.charAt(0)}
          </span>
        )}
        <span className="hidden truncate text-[15px] font-bold tracking-tight text-foreground xl:block">{brand.name}</span>
      </Link>

      <div className="-mx-1 flex min-h-0 flex-1 flex-col overflow-y-auto px-1 [scrollbar-width:thin]">
        <nav aria-label="Principal" className="flex flex-col gap-0.5">
          {visibleNav(showAgenda).map(({ tab, href, label, icon: NavIcon }) => {
            const active = tab === current && !visibleSections.some((s) => isActive(pathname, s.href));
            return (
              <Link
                key={tab}
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                title={label}
                className={cn(ITEM, active ? "font-bold text-foreground" : "font-medium text-muted hover:text-foreground")}
              >
                <NavIcon className="h-6 w-6 shrink-0" weight={active ? "fill" : "regular"} aria-hidden="true" />
                <span className="hidden xl:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {visibleSections.length > 0 && (
          <nav aria-label="Secciones" className="mt-5 flex flex-col gap-0.5">
            <p className="mb-1 hidden px-3 text-xs font-semibold text-muted xl:block">Secciones</p>
            {visibleSections.map(({ href, label, icon: SectionIcon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  aria-label={label}
                  title={label}
                  className={cn(ITEM, active ? "bg-canvas font-bold text-foreground" : "font-medium text-muted hover:text-foreground")}
                >
                  <SectionIcon className="h-6 w-6 shrink-0" weight={active ? "fill" : "regular"} aria-hidden="true" />
                  <span className="hidden xl:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {topics.length > 0 && (
          <nav aria-label="Temas del menú" className="mt-5 hidden flex-col gap-0.5 xl:flex">
            <p className="mb-1 px-3 text-xs font-semibold text-muted">Temas</p>
            {topics.slice(0, MAX_TOPICS).map((topic) => {
              const href = `/categorias/${topic.slug}`;
              const active = isActive(pathname, href);
              return (
                <Link
                  key={topic.categoryId}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(ITEM, "gap-3", active ? "bg-canvas font-bold text-foreground" : "font-medium text-muted hover:text-foreground")}
                >
                  <span className="relative shrink-0">
                    {topic.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- miniatura de 28 px
                      <img src={topic.coverUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-xs font-black text-accent">
                        {topic.name.charAt(0)}
                      </span>
                    )}
                    {topic.hasNew && <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent-fill ring-2 ring-surface" />}
                  </span>
                  <span className="truncate">
                    {topic.name}
                    {topic.hasNew && <span className="sr-only"> (nuevo)</span>}
                  </span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      <footer className="mt-4 hidden px-3 text-xs leading-relaxed text-muted xl:block">
        <nav aria-label="Legal" className="flex flex-wrap gap-x-3 gap-y-1">
          {MORE_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="mt-2">
          © {year} {brand.name}
        </p>
      </footer>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, ChevronDown, FileText, Home, Images, MapPin, Menu, Store, X, type LucideIcon } from "lucide-react";
import { useMounted } from "@/lib/use-mounted";
import type { Category } from "@/lib/api/types";

const CATEGORY_PREVIEW_COUNT = 8;

const ICON_BY_HREF: Record<string, LucideIcon> = {
  "/": Home,
  "/publicaciones": FileText,
  "/lugares": MapPin,
  "/eventos": CalendarDays,
  "/galerias": Images,
  "/directorio": Store,
};

/**
 * Menú hamburguesa mobile/tablet: panel lateral (Sheet) que entra desde la
 * derecha con overlay, no un dropdown flotante — con varios enlaces necesita
 * el alto completo de la pantalla, no una tarjeta chica. Bloquea el scroll
 * del body mientras está abierto (patrón estándar de Sheet/Drawer).
 *
 * El overlay + panel se montan con un portal directo a `document.body` (no
 * inline dentro del header): `<SiteHeader>` tiene `backdrop-blur-md`, y
 * `backdrop-filter`/`filter` en un ancestro crea un "containing block" nuevo
 * para sus descendientes `position: fixed` — un fixed adentro del header
 * queda fijo relativo AL HEADER, no a la pantalla, así que el panel se veía
 * apachurrado en la franja del header en vez de ocupar la pantalla completa
 * (bug real, visto en captura). Portal a body evita el problema de raíz —
 * mismo motivo por el que Radix/shadcn Dialog siempre portalean.
 *
 * `h-[100dvh]` en vez de confiar solo en `inset-y-0`: en navegadores
 * mobile con barra de direcciones que aparece/desaparece al hacer scroll,
 * `100vh` puede quedar más alto que el viewport visible real, dejando el
 * panel "cortado" contra la barra del navegador — `dvh` sí se ajusta al
 * alto visible en cada momento.
 *
 * `links` viene ya filtrado por SiteHeader (Server Component) según qué
 * módulos tienen contenido publicado — este componente no decide eso, solo
 * lo dibuja.
 */
export function MobileNav({ links, categories }: { links: { href: string; label: string }[]; categories: Category[] }) {
  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const [open, setOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const visibleCategories = showAllCategories ? sortedCategories : sortedCategories.slice(0, CATEGORY_PREVIEW_COUNT);
  const mounted = useMounted();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-nav-sheet"
        aria-label="Abrir menú"
        className="flex h-11 w-11 items-center justify-center rounded-md text-foreground hover:bg-border/60"
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setOpen(false)}
                  aria-hidden="true"
                  className="fixed inset-0 z-[60] bg-black/50"
                />
                <motion.nav
                  id="mobile-nav-sheet"
                  aria-label="Principal (mobile)"
                  initial={reduceMotion ? { opacity: 0 } : { x: "100%" }}
                  animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { x: "100%" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  // z-[60]: por encima del banner de cookies y del anchor ad (ambos fixed, z-50/z-40)
                  // — si no, con el aviso de cookies todavía visible, tapaba la parte de abajo del menú.
                  // scrollbar oculta (Windows/Edge la dibuja visible incluso cuando el contenido casi
                  // no desborda): sigue siendo scrolleable si el menú crece, solo no se ve la barra.
                  className="fixed inset-y-0 right-0 z-[60] flex h-[100dvh] w-80 max-w-[88vw] flex-col overflow-y-auto border-l border-foreground/[0.06] bg-surface shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <div className="flex h-16 shrink-0 items-center justify-between border-b border-foreground/[0.06] px-5">
                    <span className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Menú</span>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Cerrar menú"
                      className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-canvas"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col gap-1 px-3 py-4">
                    {links.map((link) => {
                      const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                      const Icon = ICON_BY_HREF[link.href];
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition-colors ${
                            active ? "bg-accent-soft text-accent" : "text-foreground hover:bg-canvas"
                          }`}
                        >
                          {Icon && (
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                active ? "bg-accent text-accent-foreground" : "bg-canvas text-muted"
                              }`}
                            >
                              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                            </span>
                          )}
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>

                  {sortedCategories.length > 0 && (
                    <div className="shrink-0 border-t border-foreground/[0.06] bg-canvas/50 px-5 py-4">
                      <span className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Categorías</span>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {visibleCategories.map((category) => (
                          <Link
                            key={category.id}
                            href={`/categorias/${category.slug}`}
                            onClick={() => setOpen(false)}
                            className="rounded-full border border-foreground/[0.08] bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                      {sortedCategories.length > CATEGORY_PREVIEW_COUNT && (
                        <button
                          type="button"
                          onClick={() => setShowAllCategories((v) => !v)}
                          className="mt-3 flex items-center gap-1 text-xs font-semibold text-accent"
                        >
                          {showAllCategories ? "Ver menos" : `Ver todas (${sortedCategories.length})`}
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform ${showAllCategories ? "rotate-180" : ""}`}
                            aria-hidden="true"
                          />
                        </button>
                      )}
                    </div>
                  )}
                </motion.nav>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

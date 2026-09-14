"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Filtro genérico como desplegable compacto — mismo mecanismo (abrir/cerrar,
 * click afuera, Escape) reutilizado por cualquier filtro de una sola
 * dimensión: categoría en los 6 listados y en /buscar, tipo de contenido en
 * /buscar. Antes cada uno de estos era una fila de pastillas siempre
 * visible; con 6-7 opciones esa fila se ve como una barra de filtros de
 * sitio viejo, y en /buscar además repetía las mismas palabras que ya están
 * en la navegación principal (Publicaciones/Lugares/Eventos/...), sin
 * aportar nada nuevo. Un botón que solo despliega la lista cuando el
 * visitante de verdad quiere afinar resuelve las dos cosas.
 *
 * Recibe `basePath` + `extraParams` (serializables) en vez de una función
 * `buildHref`: es un Client Component ("use client") y una función armada
 * en el Server Component que lo llama no puede cruzar ese límite (bug real:
 * "Functions cannot be passed directly to Client Components", encontrado en
 * producción probando el desplegable de categoría).
 */
export function FilterMenu({
  label,
  allLabel,
  options,
  activeValue,
  paramName,
  basePath,
  extraParams,
}: {
  /** Texto del botón cuando no hay filtro activo (ej. "Filtrar por tema", "Tipo de contenido"). */
  label: string;
  /** Texto de la opción "quitar filtro" dentro del panel (ej. "Todas las categorías", "Todo el contenido"). */
  allLabel: string;
  options: FilterOption[];
  activeValue: string | null;
  /** Nombre del query param que este filtro controla (ej. "categoryId", "type"). */
  paramName: string;
  basePath: string;
  /** Otros filtros ya activos a preservar — nunca incluye `paramName` ni `page`, esos los pone esta función. */
  extraParams?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const active = options.find((o) => o.value === activeValue) ?? null;

  function hrefFor(value: string | null): string {
    const params = new URLSearchParams(extraParams);
    if (value) params.set(paramName, value);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (options.length === 0) return null;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
          active ? "bg-accent text-accent-foreground" : "border border-foreground/[0.08] text-muted hover:border-accent/50 hover:text-foreground"
        }`}
      >
        {active ? active.label : label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 top-full z-30 mt-2 w-64 max-w-[90vw] rounded-2xl border border-foreground/[0.06] bg-surface p-2 shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_16px_32px_-16px_rgb(0_0_0_/_0.16)]"
          >
            <Link
              href={hrefFor(null)}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeValue === null ? "bg-accent-soft text-accent" : "text-foreground hover:bg-canvas"
              }`}
            >
              {allLabel}
            </Link>
            {options.map((option) => (
              <Link
                key={option.value}
                href={hrefFor(option.value)}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activeValue === option.value ? "bg-accent-soft text-accent" : "text-foreground hover:bg-canvas"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { HomeItem } from "@/lib/home-items";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { cn } from "@/lib/utils";

export const HERO_ROTATION_MS = 6000;

/**
 * Cabecera del home sobre el lienzo verde claro (sin franja negra, a
 * pedido: "que no se vea mucho negro"): un destacado grande que rota solo cada 6 s entre
 * los contenidos más nuevos (mezcla de tipos), con lista lateral de los
 * demás, puntos y contador. Pausa al pasar el mouse o enfocar con teclado
 * (WCAG 2.2.2) y no rota sola si el visitante pidió menos movimiento.
 * Todos los slides están en el DOM (solo cambia cuál es visible) para que
 * las 4 imágenes carguen una vez y el cambio sea instantáneo.
 */
export function HeroRotator({ items, categoryNames }: { items: HomeItem[]; categoryNames: Record<string, string> }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const count = items.length;

  useEffect(() => {
    if (count < 2 || paused || reduceMotion) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), HERO_ROTATION_MS);
    return () => clearInterval(timer);
  }, [count, paused, reduceMotion]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  if (count === 0) return null;
  const others = items.filter((_, i) => i !== index).slice(0, 3);

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Destacados"
      className="bg-canvas py-5 sm:py-8"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 sm:px-6 lg:grid-cols-12 lg:gap-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:col-span-7 lg:gap-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-canvas-border bg-canvas-strong shadow-sm sm:aspect-[16/9]">
            {items.map((item, i) => (
              <Link
                key={item.id}
                href={item.href}
                aria-hidden={i !== index}
                tabIndex={i === index ? 0 : -1}
                className={cn(
                  "group absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none",
                  i === index ? "opacity-100" : "pointer-events-none opacity-0",
                )}
              >
                {item.imageUrl ? (
                  <SkeletonImage
                    src={item.imageUrl}
                    alt={item.title}
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    sizes="(min-width: 1024px) 58vw, 100vw"
                  />
                ) : (
                  <NoImagePlaceholder />
                )}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(9,9,11,0.92) 0%, rgba(9,9,11,0.45) 45%, transparent 75%)" }}
                />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 sm:gap-2.5 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold tracking-wider text-accent-foreground uppercase sm:text-xs">
                      {item.typeLabel}
                    </span>
                    <span className="text-xs font-semibold tracking-wide text-green-200">
                      {item.kind === "evento" ? item.dateLabel : categoryNames[item.categoryId]}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl lg:text-3xl">{item.title}</h2>
                  {item.excerpt && (
                    <p className="hidden text-sm leading-relaxed text-white/80 line-clamp-2 sm:block sm:text-base">{item.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {count > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center" role="group" aria-label="Elegir destacado">
                {items.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={i === index}
                    aria-label={`Destacado ${i + 1}: ${item.title}`}
                    onClick={() => setIndex(i)}
                    className="flex h-11 min-w-11 cursor-pointer items-center justify-center px-0.5"
                  >
                    <span
                      className={cn(
                        "block h-1 rounded-full transition-[width,background-color] duration-300",
                        i === index ? "w-10 bg-accent" : "w-3 bg-canvas-border",
                      )}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs tabular-nums text-muted">
                {index + 1} / {count}
              </span>
            </div>
          )}
        </div>

        {others.length > 0 && (
          <div className="hidden flex-col gap-3 lg:col-span-5 lg:flex">
            {others.map((item) => {
              const i = items.indexOf(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className="flex cursor-pointer items-center gap-4 rounded-2xl border border-canvas-border bg-surface p-3.5 text-left shadow-sm transition-colors hover:border-accent/60"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-canvas-strong">
                    {item.imageUrl ? (
                      <SkeletonImage src={item.imageUrl} alt="" className="object-cover" sizes="96px" />
                    ) : (
                      <NoImagePlaceholder />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-[11px] font-semibold tracking-wider text-accent uppercase">
                      {item.kind === "evento" ? `Evento · ${item.dateLabel}` : item.typeLabel}
                    </span>
                    <span className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">{item.title}</span>
                    {item.excerpt && <span className="line-clamp-1 text-[13px] text-muted">{item.excerpt}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Miniaturas del carrusel en celular: fila deslizable con las otras portadas. */}
      {others.length > 0 && (
        <div className="-mx-0 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
          {others.map((item) => {
            const i = items.indexOf(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(i)}
                className="flex w-56 shrink-0 cursor-pointer snap-start items-center gap-3 rounded-xl border border-canvas-border bg-surface p-2.5 text-left shadow-sm"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-canvas-strong">
                  {item.imageUrl ? <SkeletonImage src={item.imageUrl} alt="" className="object-cover" sizes="56px" /> : <NoImagePlaceholder />}
                </div>
                <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">{item.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

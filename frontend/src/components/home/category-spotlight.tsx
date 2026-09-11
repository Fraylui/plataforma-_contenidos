"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { HomeItem } from "@/lib/home-items";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { cn } from "@/lib/utils";
import { HERO_ROTATION_MS } from "./hero-rotator";

export interface SpotlightCategory {
  id: string;
  name: string;
  slug: string;
  items: HomeItem[];
}

const ITEMS_PER_CATEGORY = 4;

/**
 * "Categoría en foco": en vez de listar todas las categorías (a pedido:
 * "que no se muestre cada categoría"), muestra una a la vez con sus
 * contenidos más nuevos y va rotando sola; los chips permiten elegir a mano.
 * Solo recibe categorías que tienen al menos un contenido publicado.
 *
 * Estructura en tres filas fijas (título + enlace, chips, rejilla de 4)
 * para que el alto no salte al cambiar de categoría.
 */
export function CategorySpotlight({ categories }: { categories: SpotlightCategory[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const count = categories.length;

  useEffect(() => {
    if (count < 2 || paused || reduceMotion) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), HERO_ROTATION_MS);
    return () => clearInterval(timer);
  }, [count, paused, reduceMotion]);

  if (count === 0) return null;
  const current = categories[index] ?? categories[0];
  const items = current.items.slice(0, ITEMS_PER_CATEGORY);

  return (
    <section
      aria-labelledby="categoria-en-foco"
      className="bg-canvas-strong py-8 sm:py-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:gap-5 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold tracking-wider text-muted uppercase sm:text-xs">Categoría en foco</span>
            <h2 id="categoria-en-foco" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              <span className="text-accent">{current.name}</span>
            </h2>
          </div>
          <Link
            href={`/categorias/${current.slug}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent bg-surface px-3.5 py-2 text-[13px] font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Ver {current.name}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Elegir categoría"
        >
          {categories.map((category, i) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                "h-9 shrink-0 cursor-pointer rounded-full border px-3.5 text-[13px] whitespace-nowrap transition-colors",
                i === index
                  ? "border-accent bg-accent font-semibold text-accent-foreground"
                  : "border-canvas-border bg-surface font-medium text-foreground hover:border-accent/60",
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group flex flex-col overflow-hidden rounded-2xl border border-canvas-border bg-surface shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-canvas">
                {item.imageUrl ? (
                  <SkeletonImage
                    src={item.imageUrl}
                    alt=""
                    fade={false}
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    sizes="(min-width: 1024px) 22vw, 50vw"
                  />
                ) : (
                  <NoImagePlaceholder />
                )}
                <span className="absolute top-2 left-2 rounded-md bg-accent px-2 py-0.5 text-[10px] font-semibold tracking-wider text-accent-foreground uppercase">
                  {item.kind === "evento" ? `Evento · ${item.dateLabel}` : item.typeLabel}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-2.5 sm:p-3">
                <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground transition-colors group-hover:text-accent sm:text-sm">
                  {item.title}
                </span>
                {item.excerpt && <span className="hidden text-xs leading-relaxed text-muted line-clamp-2 sm:block">{item.excerpt}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

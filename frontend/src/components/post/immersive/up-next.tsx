"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretDoubleDown } from "@phosphor-icons/react";
import type { HomeItem } from "@/lib/home-items";
import { PreviewImage } from "@/components/ui/preview-image";
import { SkeletonImage } from "@/components/ui/skeleton-image";

const COVER = "object-cover transition-[scale] duration-500 ease-out motion-safe:group-hover:scale-[1.03]";

/**
 * Parte de la portada siguiente que debe verse para pasar: casi toda la
 * pantalla, es decir, la persona la subió a propósito (verla asomar no basta).
 */
export const ADVANCE_RATIO = 0.9;
/** Tiempo que debe quedarse así: un roce del scroll no navega. */
export const ADVANCE_HOLD_MS = 400;

/**
 * «Sigue» al final del detalle inmersivo (spec 2026-10-21): la portada de la
 * siguiente publicación casi a pantalla completa, como el próximo Reel. Se
 * toca, o se sigue bajando hasta que llena la pantalla y entra sola; como la
 * página siguiente abre con esa misma portada, el paso se ve continuo.
 * Siempre por gesto de la persona (nunca temporizador), sin inflar páginas.
 */
export function UpNext({ item }: { item: HomeItem | null }) {
  const router = useRouter();
  const card = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const target = card.current;
    if (!item || !target) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer);
        if (entry && entry.intersectionRatio >= ADVANCE_RATIO) {
          timer = setTimeout(() => router.push(item.href), ADVANCE_HOLD_MS);
        }
      },
      { threshold: [0, 0.5, ADVANCE_RATIO, 1] },
    );
    observer.observe(target);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [item, router]);

  if (!item) return null;
  return (
    <section aria-label="Sigue" className="mt-12">
      <Link
        ref={card}
        href={item.href}
        className="up-next-card group relative flex h-[calc(100svh-10rem)] min-h-[420px] flex-col justify-end overflow-hidden bg-linear-to-br from-accent-soft to-canvas-strong sm:rounded-card"
      >
        {/* Una foto subida trae la URL interna del backend (serverImageUrl): solo next/image puede pedirla;
            un <img> desde el navegador falla y la portada quedaba vacía. */}
        {item.imageUrl &&
          (item.imageIsExternal ? (
            <PreviewImage src={item.imageUrl} fallback={null} className={`absolute inset-0 size-full ${COVER}`} />
          ) : (
            <SkeletonImage src={item.imageUrl} alt="" sizes="(min-width: 1024px) 760px, 100vw" className={COVER} />
          ))}
        <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-black/10" />
        <span className="relative space-y-3 p-5 sm:p-8">
          <span className="inline-flex rounded-full bg-accent-fill px-3 py-1 text-xs font-bold text-accent-foreground">Sigue</span>
          <span className="block text-[clamp(1.5rem,5vw,2.5rem)] leading-[1.1] font-extrabold tracking-tight text-balance text-white">
            {item.title}
          </span>
          <span aria-hidden="true" className="flex items-center gap-3 pt-2 text-sm font-medium text-white/85">
            <CaretDoubleDown className="size-5 motion-safe:animate-bounce" />
            Sigue bajando para pasar
            <span className="h-1 w-24 overflow-hidden rounded-full bg-white/25">
              <span className="up-next-fill block h-full origin-left scale-x-0 bg-accent-fill" />
            </span>
          </span>
        </span>
      </Link>
    </section>
  );
}

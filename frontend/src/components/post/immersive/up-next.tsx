"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretDoubleDown } from "@phosphor-icons/react";
import type { HomeItem } from "@/lib/home-items";
import { PreviewImage } from "@/components/ui/preview-image";

/** Cuánto hay que seguir bajando después de la tarjeta para pasar a la siguiente. */
export const ADVANCE_DISTANCE_PX = 320;
/** Tiempo que el final debe quedar a la vista: un roce del scroll no navega. */
export const ADVANCE_HOLD_MS = 600;

/**
 * «Sigue» al final del detalle inmersivo (spec 2026-10-21): la siguiente
 * publicación, como en Reels. Se toca, o se sigue bajando: al llegar al
 * final del tramo y quedarse ahí, entra sola. Siempre por gesto de la
 * persona (nunca por temporizador), así no infla páginas ante AdSense.
 */
export function UpNext({ item }: { item: HomeItem | null }) {
  const router = useRouter();
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = sentinel.current;
    if (!item || !target) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer);
        if (entry?.isIntersecting) timer = setTimeout(() => router.push(item.href), ADVANCE_HOLD_MS);
      },
      { threshold: 1 },
    );
    observer.observe(target);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [item, router]);

  if (!item) return null;
  return (
    <section aria-label="Sigue" className="mt-12 px-4 sm:px-0">
      <Link href={item.href} className="group relative block aspect-video overflow-hidden rounded-card bg-linear-to-br from-accent-soft to-canvas-strong shadow-card">
        {item.imageUrl && (
          <PreviewImage
            src={item.imageUrl}
            fallback={null}
            className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]"
          />
        )}
        <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent" />
        <span className="absolute inset-x-0 bottom-0 space-y-1.5 p-5">
          <span className="inline-flex rounded-full bg-accent-fill px-2.5 py-0.5 text-xs font-bold text-accent-foreground">Sigue</span>
          <span className="block text-xl leading-tight font-extrabold text-balance text-white sm:text-2xl">{item.title}</span>
        </span>
      </Link>

      <div className="up-next-track flex flex-col items-center justify-start gap-3 pt-6" style={{ height: ADVANCE_DISTANCE_PX }}>
        <CaretDoubleDown aria-hidden="true" className="size-6 text-muted motion-safe:animate-bounce" />
        <p className="text-sm font-medium text-muted">Sigue bajando para pasar</p>
        <div aria-hidden="true" className="h-1 w-32 overflow-hidden rounded-full bg-canvas-strong">
          <div className="up-next-fill h-full origin-left scale-x-0 bg-accent-fill" />
        </div>
      </div>
      <div ref={sentinel} aria-hidden="true" className="h-px" />
    </section>
  );
}

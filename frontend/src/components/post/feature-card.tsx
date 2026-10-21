/* eslint-disable @next/next/no-img-element -- enlace externo pegado en el panel, host arbitrario */
import Link from "next/link";
import type { HomeItem } from "@/lib/home-items";
import { SkeletonImage } from "@/components/ui/skeleton-image";

/**
 * Tarjeta destacada del feed (Inicio 2026-10-21): cada tanto una publicación
 * va alta (4:5) con el título sobre la foto, como una portada, para cortar la
 * monotonía de tarjetas iguales. Toda la tarjeta abre el contenido.
 */
export function FeatureCard({ item, categoryName }: { item: HomeItem; categoryName?: string }) {
  const cover = item.images[0];
  return (
    <article aria-labelledby={`feature-${item.id}`} className="overflow-hidden sm:rounded-card sm:shadow-card">
      <Link data-testid="feature-card" href={item.href} className="group relative flex aspect-[4/5] flex-col justify-end bg-canvas-strong">
        {cover &&
          (cover.isExternal ? (
            <img src={cover.url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <SkeletonImage src={cover.url} alt="" sizes="(min-width: 640px) 620px, 100vw" className="object-cover" />
          ))}
        <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent" />
        <span className="relative space-y-2 p-5 sm:p-6">
          <span className="inline-flex rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
            {item.typeLabel}
            {categoryName && ` · ${categoryName}`}
          </span>
          <span
            id={`feature-${item.id}`}
            className="block text-[clamp(1.5rem,5vw,2.25rem)] leading-[1.1] font-extrabold tracking-tight text-balance text-white transition-transform duration-300 motion-safe:group-hover:-translate-y-0.5"
          >
            {item.title}
          </span>
          {item.excerpt && <span className="line-clamp-2 block text-sm text-white/85">{item.excerpt}</span>}
        </span>
      </Link>
    </article>
  );
}

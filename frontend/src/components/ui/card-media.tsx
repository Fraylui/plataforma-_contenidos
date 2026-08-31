import type { ReactNode } from "react";
import { serverImageUrl } from "@/lib/server-image-url";
import { NoImagePlaceholder } from "./no-image-placeholder";
import { SkeletonImage } from "./skeleton-image";

/**
 * Bloque de imagen compartido por las 7 tarjetas de contenido: aspect ratio
 * fijo, degradado inferior para legibilidad, barra de acento y badge tipo
 * pill opcional. Antes este markup estaba duplicado en cada *-card.tsx —
 * ahora es el único lugar que hay que tocar para cambiar el tratamiento
 * visual de todas las tarjetas a la vez.
 *
 * `children` reemplaza la imagen simple cuando la tarjeta necesita un
 * layout propio (ej. GalleryCard: mosaico de hasta 4 miniaturas), pero
 * conserva el degradado/barra/badge de acá.
 */
export function CardMedia({
  imageId,
  alt,
  badge,
  children,
}: {
  imageId?: string | null;
  alt: string;
  badge?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="relative aspect-video overflow-hidden">
      {children ??
        (imageId ? (
          <SkeletonImage
            src={serverImageUrl(`/api/v1/images/${imageId}/file`)}
            alt={alt}
            className="object-cover group-hover:scale-105"
          />
        ) : (
          <NoImagePlaceholder />
        ))}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.22) 45%, transparent 100%)" }}
      />
      <span className="absolute inset-x-0 bottom-0 h-1 bg-accent" aria-hidden="true" />
      {badge && (
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold tracking-wide text-zinc-900 uppercase backdrop-blur-md">
          {badge}
        </span>
      )}
    </div>
  );
}

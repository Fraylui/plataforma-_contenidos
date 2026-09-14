import type { ReactNode } from "react";
import { serverImageUrl } from "@/lib/server-image-url";
import { cn } from "@/lib/utils";
import { NoImagePlaceholder } from "./no-image-placeholder";
import { SkeletonImage } from "./skeleton-image";

/**
 * Bloque de imagen compartido por las 7 tarjetas de contenido: aspect ratio
 * fijo, degradado inferior para legibilidad y barra de acento. Antes este
 * markup estaba duplicado en cada *-card.tsx — ahora es el único lugar que
 * hay que tocar para cambiar el tratamiento visual de todas las tarjetas a
 * la vez.
 *
 * Ya no lleva un badge de tipo encima de la foto (ver CardKicker): dos
 * textos pegados a la imagen — el badge acá y la categoría debajo —
 * competían entre sí, y en un listado de un solo tipo (Directorio mostrando
 * "Restaurante" en cada tarjeta) era puro ruido repetido. Ese dato ahora
 * vive en una sola línea bajo la imagen, junto a la categoría.
 *
 * `children` reemplaza la imagen simple cuando la tarjeta necesita un
 * layout propio (ej. GalleryCard: mosaico de hasta 4 miniaturas), pero
 * conserva el degradado/barra de acá.
 */
export function CardMedia({
  imageId,
  externalUrl,
  alt,
  children,
  className,
}: {
  imageId?: string | null;
  /** Portada por enlace externo (ver ContentImage) — alternativa a imageId, nunca ambas. */
  externalUrl?: string | null;
  alt: string;
  children?: ReactNode;
  /** Para la variante destacada (ver CardKicker/*-card.tsx `featured`): reemplaza el aspect-video fijo por uno que llena la columna en pantallas grandes. */
  className?: string;
}) {
  return (
    <div className={cn("relative aspect-video overflow-hidden", className)}>
      {children ??
        (imageId ? (
          <SkeletonImage
            src={serverImageUrl(`/api/v1/images/${imageId}/file`)}
            alt={alt}
            className="object-cover group-hover:scale-105"
          />
        ) : externalUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- enlace externo pegado por quien redacta, host arbitrario
          <img src={externalUrl} alt={alt} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <NoImagePlaceholder />
        ))}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.22) 45%, transparent 100%)" }}
      />
      <span className="absolute inset-x-0 bottom-0 h-1 bg-accent" aria-hidden="true" />
    </div>
  );
}

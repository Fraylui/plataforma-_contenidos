import { SkeletonImage } from "@/components/ui/skeleton-image";
import { serverImageUrl } from "@/lib/server-image-url";
import { cn } from "@/lib/utils";
import type { ContentImage } from "@/lib/api/types";

/**
 * Una imagen de contenido (Publicaciones/Lugares/Eventos): subida pasa por
 * next/image (SkeletonImage — necesita una URL alcanzable desde el
 * servidor de Next, ver server-image-url.ts); por enlace externo se
 * renderiza con <img> plano, porque next/image no puede optimizar un host
 * arbitrario sin agregarlo a next.config.ts, y eso abriría la puerta a
 * cualquier URL que alguien pegue en el editor — mismo criterio que el
 * logo de la marca en site-header.tsx. Debe usarse dentro de un
 * contenedor `relative` con aspect-ratio fijo (llena ese contenedor).
 */
export function ContentImageDisplay({
  image,
  alt,
  className,
  sizes,
  priority = false,
}: {
  image: ContentImage;
  alt: string;
  className?: string;
  sizes?: string;
  /** La foto principal de la pantalla (LCP): se pide primero y se muestra sin esperar a JavaScript. */
  priority?: boolean;
}) {
  if (image.imageId) {
    return (
      <SkeletonImage
        src={serverImageUrl(`/api/v1/images/${image.imageId}/file`)}
        alt={alt}
        className={className}
        sizes={sizes}
        priority={priority}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- enlace externo pegado por quien redacta, host arbitrario
    <img
      src={image.externalUrl ?? ""}
      alt={alt}
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : "lazy"}
      className={cn("absolute inset-0 h-full w-full", className)}
    />
  );
}

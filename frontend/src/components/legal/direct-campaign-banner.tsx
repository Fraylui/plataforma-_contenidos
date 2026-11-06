"use client";

import { useRef } from "react";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { imageUrl } from "@/lib/image-url";
import { cn } from "@/lib/utils";
import type { ResolvedCampaign } from "@/lib/api/types";
import { useViewableImpression } from "@/components/legal/use-viewable-impression";

/**
 * Banner de display de una campaña directa, como lo muestra cualquier medio
 * profesional:
 *  - La creatividad la diseña el anunciante (marca, mensaje, botón) para la
 *    medida estándar de la posición (`width`×`height`, p. ej. 300×250) y se
 *    muestra ENTERA: caja con esa proporción exacta y `object-contain`.
 *    Antes cada espacio imponía su propia proporción con `object-cover` y la
 *    imagen salía recortada (un banner con texto quedaba mutilado).
 *  - Sin `fill`: nunca más ancho que su medida, centrado (se achica en
 *    pantallas angostas sin cambiar de proporción). Con `fill`: ocupa el
 *    ancho de su columna (lateral, celda del feed, fila patrocinada) hasta
 *    FILL_MAX_SCALE veces su medida — la creatividad viene al doble, así que
 *    se sigue viendo nítida, sin franjas vacías a los costados ni un banner
 *    gigante.
 *  - "Publicidad" va arriba, FUERA de la creatividad (Google y la IAB piden
 *    que la etiqueta no tape ni se confunda con el anuncio).
 *  - El link pasa siempre por `/ads/campaigns/{id}/click` (backend): el
 *    clic queda contado y el link real nunca está en el HTML.
 *  - Cuenta la impresión solo cuando se vio de verdad (useViewableImpression).
 */
const FILL_MAX_SCALE = 1.3;

export function DirectCampaignBanner({
  campaign,
  width,
  height,
  fill = false,
  label = true,
  className,
}: {
  campaign: ResolvedCampaign;
  width: number;
  height: number;
  fill?: boolean;
  /** false cuando quien lo envuelve ya muestra la etiqueta (post «Patrocinado» del feed). */
  label?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  useViewableImpression(ref, campaign.id);
  const clickHref = imageUrl(`/api/v1/ads/campaigns/${campaign.id}/click`);
  const alt = campaign.imageAlt ?? "Publicidad";

  return (
    <figure className={cn("no-auto-ads mx-auto w-full", className)} style={{ maxWidth: fill ? Math.round(width * FILL_MAX_SCALE) : width }}>
      {label && <figcaption className="mb-1 text-[10px] font-medium tracking-[0.08em] text-muted uppercase">Publicidad</figcaption>}
      <a
        ref={ref}
        href={clickHref}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="relative block w-full overflow-hidden rounded-md bg-canvas outline-offset-2"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {campaign.imageSrc ? (
          <SkeletonImage src={campaign.imageSrc} alt={alt} className="object-contain" sizes={`${fill ? Math.round(width * FILL_MAX_SCALE) : width}px`} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- host arbitrario, cargado por el anunciante
          <img
            src={campaign.externalImageUrl ?? ""}
            alt={alt}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}
      </a>
    </figure>
  );
}

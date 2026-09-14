import type { ReactNode } from "react";
import type { ContentImage } from "@/lib/api/types";
import { ContentImageDisplay } from "./content-image-display";
import { MediaCarousel, MediaCaption } from "./media-carousel";

/**
 * Bloque de imágenes de un contenido (Publicación/Lugar/Evento), con pie de
 * foto tipo NYT/Medium — una sola imagen se muestra como bloque fijo; varias
 * del mismo contenido se navegan como carrusel deslizable estilo Instagram
 * (ver MediaCarousel). Server Component: ContentImageDisplay resuelve la URL
 * de las imágenes subidas con serverImageUrl (server-only), así que ese
 * trabajo se queda acá y solo el estado de navegación del carrusel vive en
 * un Client Component aparte.
 */
export function ContentImageGallery({
  images,
  alt,
  spacing = "my-8",
  background = "bg-zinc-950",
  fallback,
}: {
  images: ContentImage[];
  alt: string;
  /** Margen del bloque — cada página de detalle lo trae distinto (my-8/mt-8). */
  spacing?: string;
  /** Fondo detrás de la imagen mientras carga o si es transparente — cada página usa su propio token. */
  background?: string;
  /** Se muestra en el mismo bloque (mismo tamaño/borde) cuando no hay imágenes. */
  fallback?: ReactNode;
}) {
  if (images.length === 0) {
    if (!fallback) return null;
    return (
      <div className={`relative ${spacing} aspect-video w-full overflow-hidden rounded-2xl border border-border ${background} shadow-lg`}>
        {fallback}
      </div>
    );
  }

  if (images.length === 1) {
    const image = images[0];
    return (
      <figure className={spacing}>
        <div className={`relative aspect-video w-full overflow-hidden rounded-2xl border border-border ${background} shadow-lg`}>
          <ContentImageDisplay image={image} alt={image.title ?? alt} className="object-cover" />
        </div>
        <MediaCaption title={image.title} caption={image.caption} />
      </figure>
    );
  }

  const captions = images.map((image) => ({ title: image.title, caption: image.caption }));
  const slides = images.map((image, index) => (
    <div key={image.imageId ?? image.externalUrl ?? index} className="relative aspect-video w-full">
      <ContentImageDisplay
        image={image}
        alt={image.title ?? `${alt} — fotografía ${index + 1}`}
        className="object-cover"
      />
    </div>
  ));

  return (
    <MediaCarousel
      spacing={spacing}
      background={background}
      slides={slides}
      captions={captions}
      prevLabel="Foto anterior"
      nextLabel="Foto siguiente"
      dotLabelPrefix="Ir a la foto"
    />
  );
}

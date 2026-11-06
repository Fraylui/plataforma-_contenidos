import type { ContentImage } from "@/lib/api/types";
import { ContentImageDisplay } from "@/components/content/content-image-display";

/**
 * Galería en vertical (dueño 2026-10-21): las fotos una debajo de otra, a
 * todo el ancho, como al recorrer Instagram, en vez de un carrusel donde la
 * mayoría no se ve. Todas en 4:5 (el formato de Instagram) para que la
 * página no salte al cargar. La portada es la foto 1: esta lista empieza en
 * la 2. Cada foto con su título y su pie, si los tiene.
 */
export function PhotoStack({ images, alt }: { images: ContentImage[]; alt: string }) {
  if (images.length === 0) return null;
  const total = images.length + 1;
  return (
    <div className="space-y-6 sm:space-y-8">
      {images.map((image, index) => {
        const label = image.title ?? `${alt}, foto ${index + 2} de ${total}`;
        return (
          <figure key={image.imageId ?? image.externalUrl ?? index}>
            <div role="img" aria-label={label} className="relative aspect-[4/5] overflow-hidden bg-canvas-strong sm:rounded-card">
              <ContentImageDisplay
                image={image}
                alt=""
                sizes="(min-width: 1024px) 680px, 100vw"
                className="object-cover"
              />
            </div>
            {(image.title || image.caption) && (
              <figcaption className="mt-2 px-4 text-sm leading-relaxed sm:px-0">
                {image.title && <span className="font-semibold text-foreground">{image.title}</span>}
                {image.title && image.caption && " "}
                {image.caption && <span className="text-muted">{image.caption}</span>}
              </figcaption>
            )}
          </figure>
        );
      })}
    </div>
  );
}

import { AnimatedCard } from "@/components/ui/animated-card";
import type { GallerySummary } from "@/lib/api/types";
import { imageUrl } from "@/lib/image-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";

const MOSAIC_SIZE = 4;

/**
 * A diferencia de Article/Place/EventCard (una sola imagen de portada),
 * acá se muestra un mosaico de hasta 4 miniaturas — comunica visualmente
 * "esto es una colección" antes de entrar, coherente con que el contenido
 * de una Galería ES el conjunto de fotos, no una sola portada.
 */
export function GalleryCard({ gallery }: { gallery: GallerySummary }) {
  const thumbnails = gallery.imageIds.slice(0, MOSAIC_SIZE);

  return (
    <AnimatedCard
      href={`/galerias/${gallery.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-all duration-200 hover:border-accent hover:shadow-md focus-visible:border-accent"
    >
      <div className="relative aspect-video">
        {thumbnails.length === 0 ? (
          <NoImagePlaceholder />
        ) : thumbnails.length === 1 ? (
          // eslint-disable-next-line @next/next/no-img-element -- host propio del backend
          <img
            src={imageUrl(`/api/v1/images/${thumbnails[0]}/file`)}
            alt={gallery.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full grid-cols-2 gap-0.5">
            {thumbnails.map((imageId, index) => (
              // eslint-disable-next-line @next/next/no-img-element -- host propio del backend
              <img
                key={imageId}
                src={imageUrl(`/api/v1/images/${imageId}/file`)}
                alt=""
                className={`h-full w-full object-cover ${
                  thumbnails.length === 3 && index === 0 ? "row-span-2" : ""
                }`}
              />
            ))}
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 40%, transparent 100%)" }}
        />
        <span className="absolute inset-x-0 bottom-0 h-1 bg-accent" aria-hidden="true" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-xs font-medium tracking-wide text-accent uppercase">
          Galería · {gallery.imageIds.length} foto{gallery.imageIds.length === 1 ? "" : "s"}
        </span>
        <h2 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
          {gallery.title}
        </h2>
        {gallery.excerpt && <p className="text-sm leading-relaxed text-muted line-clamp-2">{gallery.excerpt}</p>}
      </div>
    </AnimatedCard>
  );
}

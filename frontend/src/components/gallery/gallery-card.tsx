import { AnimatedCard } from "@/components/ui/animated-card";
import { CardMedia } from "@/components/ui/card-media";
import type { GallerySummary } from "@/lib/api/types";
import { serverImageUrl } from "@/lib/server-image-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import { SkeletonImage } from "@/components/ui/skeleton-image";

const MOSAIC_SIZE = 4;

/**
 * A diferencia de Article/Place/EventCard (una sola imagen de portada),
 * acá se muestra un mosaico de hasta 4 miniaturas — comunica visualmente
 * "esto es una colección" antes de entrar, coherente con que el contenido
 * de una Galería ES el conjunto de fotos, no una sola portada. Por eso pasa
 * el mosaico como children de CardMedia en vez de un imageId único: el
 * degradado/barra/badge de CardMedia siguen aplicando encima.
 */
export function GalleryCard({ gallery }: { gallery: GallerySummary }) {
  const thumbnails = gallery.imageIds.slice(0, MOSAIC_SIZE);
  const badge = `Galería · ${gallery.imageIds.length} foto${gallery.imageIds.length === 1 ? "" : "s"}`;

  return (
    <AnimatedCard href={`/galerias/${gallery.slug}`}>
      <CardMedia alt={gallery.title} badge={badge}>
        {thumbnails.length === 0 ? (
          <NoImagePlaceholder />
        ) : thumbnails.length === 1 ? (
          <SkeletonImage
            src={serverImageUrl(`/api/v1/images/${thumbnails[0]}/file`)}
            alt={gallery.title}
            className="object-cover"
          />
        ) : (
          <div className="grid h-full w-full grid-cols-2 gap-0.5">
            {thumbnails.map((imageId, index) => (
              <div
                key={imageId}
                className={`relative overflow-hidden ${thumbnails.length === 3 && index === 0 ? "row-span-2" : ""}`}
              >
                <SkeletonImage src={serverImageUrl(`/api/v1/images/${imageId}/file`)} alt="" className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </CardMedia>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
          {gallery.title}
        </h2>
        {gallery.excerpt && <p className="text-sm leading-relaxed text-muted line-clamp-2">{gallery.excerpt}</p>}
      </div>
    </AnimatedCard>
  );
}

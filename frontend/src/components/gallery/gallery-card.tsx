import { AnimatedCard } from "@/components/ui/animated-card";
import { CardMedia } from "@/components/ui/card-media";
import { CardKicker } from "@/components/ui/card-kicker";
import { cn } from "@/lib/utils";
import type { GallerySummary } from "@/lib/api/types";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import { ContentImageDisplay } from "@/components/content/content-image-display";

const MOSAIC_SIZE = 4;

/**
 * A diferencia de Article/Place/EventCard (una sola imagen de portada),
 * acá se muestra un mosaico de hasta 4 miniaturas — comunica visualmente
 * "esto es una colección" antes de entrar, coherente con que el contenido
 * de una Galería ES el conjunto de fotos, no una sola portada. Por eso pasa
 * el mosaico como children de CardMedia en vez de un imageId único: el
 * degradado/barra de CardMedia siguen aplicando encima.
 *
 * `featured`: primer ítem del listado, más grande y horizontal — mismo
 * criterio que las otras 6 tarjetas de listado.
 */
export function GalleryCard({
  gallery,
  categoryName,
  featured = false,
}: {
  gallery: GallerySummary;
  categoryName?: string;
  featured?: boolean;
}) {
  const thumbnails = gallery.images.slice(0, MOSAIC_SIZE);
  const photoCount = `${gallery.images.length} foto${gallery.images.length === 1 ? "" : "s"}`;

  return (
    <AnimatedCard
      href={`/galerias/${gallery.slug}`}
      className={featured ? "sm:col-span-2 lg:grid lg:grid-cols-[1.1fr_1fr] lg:col-span-2" : undefined}
    >
      <CardMedia alt={gallery.title} className={featured ? "lg:aspect-auto lg:min-h-full" : undefined}>
        {thumbnails.length === 0 ? (
          <NoImagePlaceholder />
        ) : thumbnails.length === 1 ? (
          <ContentImageDisplay image={thumbnails[0]} alt={gallery.title} className="object-cover" />
        ) : (
          <div className="grid h-full w-full grid-cols-2 gap-0.5">
            {thumbnails.map((image, index) => (
              <div
                key={image.imageId ?? image.externalUrl ?? index}
                className={`relative overflow-hidden ${thumbnails.length === 3 && index === 0 ? "row-span-2" : ""}`}
              >
                <ContentImageDisplay image={image} alt="" className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </CardMedia>

      <div className={cn("flex flex-1 flex-col gap-2 p-5", featured && "sm:p-6")}>
        <div className="flex items-center gap-1.5">
          <CardKicker categoryName={categoryName} />
          <span className="text-[11px] font-medium text-muted">{categoryName && "· "}{photoCount}</span>
        </div>
        <h2
          className={cn(
            "font-semibold leading-snug text-foreground transition-colors group-hover:text-accent",
            featured ? "text-xl sm:text-2xl" : "text-lg",
          )}
        >
          {gallery.title}
        </h2>
        {gallery.excerpt && (
          <p className={cn("text-sm leading-relaxed text-muted", featured ? "line-clamp-3" : "line-clamp-2")}>
            {gallery.excerpt}
          </p>
        )}
      </div>
    </AnimatedCard>
  );
}

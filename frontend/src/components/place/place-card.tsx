import { AnimatedCard } from "@/components/ui/animated-card";
import { CardMedia } from "@/components/ui/card-media";
import { CardKicker } from "@/components/ui/card-kicker";
import { cn } from "@/lib/utils";
import type { PlaceSummary } from "@/lib/api/types";

/**
 * `featured`: primer ítem del listado, más grande y horizontal — ver
 * ArticleCard para el porqué (mismo criterio en las 7 tarjetas de listado).
 */
export function PlaceCard({
  place,
  categoryName,
  featured = false,
}: {
  place: PlaceSummary;
  categoryName?: string;
  featured?: boolean;
}) {
  return (
    <AnimatedCard
      href={`/lugares/${place.slug}`}
      className={featured ? "sm:col-span-2 lg:grid lg:grid-cols-[1.1fr_1fr] lg:col-span-2" : undefined}
    >
      <CardMedia
        imageId={place.coverImageId}
        externalUrl={place.coverImageUrl}
        alt={place.name}
        className={featured ? "lg:aspect-auto lg:min-h-full" : undefined}
      />
      <div className={cn("flex flex-1 flex-col gap-2 p-5", featured && "sm:p-6")}>
        <CardKicker categoryName={categoryName} />
        <h2
          className={cn(
            "font-semibold leading-snug text-foreground transition-colors group-hover:text-accent",
            featured ? "text-xl sm:text-2xl" : "text-lg",
          )}
        >
          {place.name}
        </h2>
        {place.excerpt && <p className="line-clamp-3 text-sm leading-relaxed text-muted">{place.excerpt}</p>}
      </div>
    </AnimatedCard>
  );
}

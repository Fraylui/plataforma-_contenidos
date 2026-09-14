import { AnimatedCard } from "@/components/ui/animated-card";
import { CardMedia } from "@/components/ui/card-media";
import { CardKicker } from "@/components/ui/card-kicker";
import { cn } from "@/lib/utils";
import type { BusinessSummary } from "@/lib/api/types";

/**
 * `featured`: primer ítem del listado, más grande y horizontal — mismo
 * criterio que las otras 6 tarjetas de listado.
 */
export function BusinessCard({
  business,
  categoryName,
  featured = false,
}: {
  business: BusinessSummary;
  categoryName?: string;
  featured?: boolean;
}) {
  return (
    <AnimatedCard
      href={`/directorio/${business.slug}`}
      className={featured ? "sm:col-span-2 lg:grid lg:grid-cols-[1.1fr_1fr] lg:col-span-2" : undefined}
    >
      <CardMedia
        imageId={business.coverImageId}
        alt={business.name}
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
          {business.name}
        </h2>
        {business.address && <p className="text-sm text-muted">{business.address}</p>}
        {business.excerpt && (
          <p className={cn("text-sm leading-relaxed text-muted", featured ? "line-clamp-3" : "line-clamp-2")}>
            {business.excerpt}
          </p>
        )}
      </div>
    </AnimatedCard>
  );
}

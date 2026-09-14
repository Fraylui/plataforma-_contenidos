import { AnimatedCard } from "@/components/ui/animated-card";
import { CardMedia } from "@/components/ui/card-media";
import { CardKicker } from "@/components/ui/card-kicker";
import { cn } from "@/lib/utils";
import type { ReviewSummary } from "@/lib/api/types";
import { StarRating } from "./star-rating";

/**
 * `featured`: primer ítem del listado, más grande y horizontal — mismo
 * criterio que las otras 6 tarjetas de listado.
 */
export function ReviewCard({
  review,
  categoryName,
  featured = false,
}: {
  review: ReviewSummary;
  categoryName?: string;
  featured?: boolean;
}) {
  return (
    <AnimatedCard
      href={`/resenas/${review.slug}`}
      className={featured ? "sm:col-span-2 lg:grid lg:grid-cols-[1.1fr_1fr] lg:col-span-2" : undefined}
    >
      <CardMedia
        imageId={review.coverImageId}
        alt={review.title}
        className={featured ? "lg:aspect-auto lg:min-h-full" : undefined}
      />

      <div className={cn("flex flex-1 flex-col gap-2 p-5", featured && "sm:p-6")}>
        <CardKicker categoryName={categoryName} />
        <StarRating rating={review.rating} />
        <h2
          className={cn(
            "font-semibold leading-snug text-foreground transition-colors group-hover:text-accent",
            featured ? "text-xl sm:text-2xl" : "text-lg",
          )}
        >
          {review.title}
        </h2>
        {review.subjectName && <p className="text-sm text-muted">{review.subjectName}</p>}
        {review.excerpt && (
          <p className={cn("text-sm leading-relaxed text-muted", featured ? "line-clamp-3" : "line-clamp-2")}>
            {review.excerpt}
          </p>
        )}
      </div>
    </AnimatedCard>
  );
}

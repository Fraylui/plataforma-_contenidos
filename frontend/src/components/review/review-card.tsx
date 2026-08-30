import { AnimatedCard } from "@/components/ui/animated-card";
import { CardMedia } from "@/components/ui/card-media";
import type { ReviewSummary } from "@/lib/api/types";
import { StarRating } from "./star-rating";

export function ReviewCard({ review }: { review: ReviewSummary }) {
  return (
    <AnimatedCard href={`/resenas/${review.slug}`}>
      <CardMedia imageId={review.coverImageId} alt={review.title} />

      <div className="flex flex-1 flex-col gap-2 p-5">
        <StarRating rating={review.rating} />
        <h2 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
          {review.title}
        </h2>
        {review.subjectName && <p className="text-sm text-muted">{review.subjectName}</p>}
        {review.excerpt && <p className="text-sm leading-relaxed text-muted line-clamp-2">{review.excerpt}</p>}
      </div>
    </AnimatedCard>
  );
}

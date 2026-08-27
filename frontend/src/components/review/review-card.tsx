import Link from "next/link";
import type { ReviewSummary } from "@/lib/api/types";
import { imageUrl } from "@/lib/image-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import { StarRating } from "./star-rating";

export function ReviewCard({ review }: { review: ReviewSummary }) {
  return (
    <Link
      href={`/resenas/${review.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-md focus-visible:border-accent"
    >
      <div className="aspect-video">
        {review.coverImageId ? (
          // eslint-disable-next-line @next/next/no-img-element -- host propio del backend
          <img
            src={imageUrl(`/api/v1/images/${review.coverImageId}/file`)}
            alt={review.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <NoImagePlaceholder />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <StarRating rating={review.rating} />
        <h2 className="font-serif text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
          {review.title}
        </h2>
        {review.subjectName && <p className="text-sm text-muted">{review.subjectName}</p>}
        {review.excerpt && <p className="text-sm leading-relaxed text-muted line-clamp-2">{review.excerpt}</p>}
      </div>
    </Link>
  );
}

import Link from "next/link";
import type { PlaceSummary } from "@/lib/api/types";
import { imageUrl } from "@/lib/image-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";

export function PlaceCard({ place }: { place: PlaceSummary }) {
  return (
    <Link
      href={`/lugares/${place.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-md focus-visible:border-accent"
    >
      <div className="aspect-video">
        {place.coverImageId ? (
          // eslint-disable-next-line @next/next/no-img-element -- host propio del backend
          <img
            src={imageUrl(`/api/v1/images/${place.coverImageId}/file`)}
            alt={place.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <NoImagePlaceholder />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
          {place.name}
        </h2>
        {place.excerpt && <p className="text-sm leading-relaxed text-muted line-clamp-3">{place.excerpt}</p>}
      </div>
    </Link>
  );
}

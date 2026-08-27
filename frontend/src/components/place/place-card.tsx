import Link from "next/link";
import type { PlaceSummary } from "@/lib/api/types";
import { imageUrl } from "@/lib/image-url";

export function PlaceCard({ place }: { place: PlaceSummary }) {
  return (
    <Link
      href={`/lugares/${place.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-accent focus-visible:border-accent"
    >
      <div className="aspect-video bg-border">
        {place.coverImageId ? (
          // eslint-disable-next-line @next/next/no-img-element -- host propio del backend
          <img
            src={imageUrl(`/api/v1/images/${place.coverImageId}/file`)}
            alt={place.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted">Sin fotografía</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="font-serif text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
          {place.name}
        </h2>
        {place.excerpt && <p className="text-sm leading-relaxed text-muted line-clamp-3">{place.excerpt}</p>}
      </div>
    </Link>
  );
}

import { AnimatedCard } from "@/components/ui/animated-card";
import { CardMedia } from "@/components/ui/card-media";
import type { PlaceSummary } from "@/lib/api/types";

export function PlaceCard({ place }: { place: PlaceSummary }) {
  return (
    <AnimatedCard href={`/lugares/${place.slug}`}>
      <CardMedia imageId={place.coverImageId} alt={place.name} />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
          {place.name}
        </h2>
        {place.excerpt && <p className="text-sm leading-relaxed text-muted line-clamp-3">{place.excerpt}</p>}
      </div>
    </AnimatedCard>
  );
}

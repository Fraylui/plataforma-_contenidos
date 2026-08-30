import { AnimatedCard } from "@/components/ui/animated-card";
import { CardMedia } from "@/components/ui/card-media";
import type { EventSummary } from "@/lib/api/types";
import { formatEventDateTime } from "@/lib/content-labels";

/**
 * A diferencia de ArticleCard/PlaceCard (fecha discreta o ausente), acá la
 * fecha ES el dato principal: va destacada arriba del título, no al pie.
 */
export function EventCard({ event }: { event: EventSummary }) {
  return (
    <AnimatedCard href={`/eventos/${event.slug}`}>
      <CardMedia imageId={event.coverImageId} alt={event.title} />

      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-xs font-medium tracking-wide text-accent uppercase">
          {formatEventDateTime(event.startsAt)}
        </span>
        <h2 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
          {event.title}
        </h2>
        {event.venueName && <p className="text-sm text-muted">{event.venueName}</p>}
        {event.excerpt && <p className="text-sm leading-relaxed text-muted line-clamp-2">{event.excerpt}</p>}
      </div>
    </AnimatedCard>
  );
}

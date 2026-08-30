import { AnimatedCard } from "@/components/ui/animated-card";
import type { EventSummary } from "@/lib/api/types";
import { formatEventDateTime } from "@/lib/content-labels";
import { imageUrl } from "@/lib/image-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";

/**
 * A diferencia de ArticleCard/PlaceCard (fecha discreta o ausente), acá la
 * fecha ES el dato principal: va destacada arriba del título, no al pie.
 */
export function EventCard({ event }: { event: EventSummary }) {
  return (
    <AnimatedCard
      href={`/eventos/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-all duration-200 hover:border-accent hover:shadow-md focus-visible:border-accent"
    >
      <div className="relative aspect-video">
        {event.coverImageId ? (
          // eslint-disable-next-line @next/next/no-img-element -- host propio del backend
          <img
            src={imageUrl(`/api/v1/images/${event.coverImageId}/file`)}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <NoImagePlaceholder />
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 40%, transparent 100%)" }}
        />
        <span className="absolute inset-x-0 bottom-0 h-1 bg-accent" aria-hidden="true" />
      </div>

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

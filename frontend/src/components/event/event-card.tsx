import { AnimatedCard } from "@/components/ui/animated-card";
import { CardMedia } from "@/components/ui/card-media";
import { CardKicker } from "@/components/ui/card-kicker";
import { cn } from "@/lib/utils";
import type { EventSummary } from "@/lib/api/types";
import { formatEventDateTime, isEventFinished } from "@/lib/content-labels";

/**
 * A diferencia de ArticleCard/PlaceCard (fecha discreta o ausente), acá la
 * fecha ES el dato principal: va destacada arriba del título, no al pie.
 * `featured`: primer ítem del listado, más grande y horizontal — mismo
 * criterio que las otras 6 tarjetas de listado.
 */
export function EventCard({
  event,
  categoryName,
  featured = false,
}: {
  event: EventSummary;
  categoryName?: string;
  featured?: boolean;
}) {
  const finished = isEventFinished(event);
  return (
    <AnimatedCard
      href={`/eventos/${event.slug}`}
      className={featured ? "sm:col-span-2 lg:grid lg:grid-cols-[1.1fr_1fr] lg:col-span-2" : undefined}
    >
      <CardMedia
        imageId={event.coverImageId}
        externalUrl={event.coverImageUrl}
        alt={event.title}
        className={featured ? "lg:aspect-auto lg:min-h-full" : undefined}
      />

      <div className={cn("flex flex-1 flex-col gap-2 p-5", featured && "sm:p-6")}>
        <CardKicker categoryName={categoryName} />
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium tracking-wide text-accent uppercase">
            {formatEventDateTime(event.startsAt)}
          </span>
          {finished && (
            <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">
              Finalizado
            </span>
          )}
        </div>
        <h2
          className={cn(
            "font-semibold leading-snug text-foreground transition-colors group-hover:text-accent",
            featured ? "text-xl sm:text-2xl" : "text-lg",
          )}
        >
          {event.title}
        </h2>
        {event.venueName && <p className="text-sm text-muted">{event.venueName}</p>}
        {event.excerpt && (
          <p className={cn("text-sm leading-relaxed text-muted", featured ? "line-clamp-3" : "line-clamp-2")}>
            {event.excerpt}
          </p>
        )}
      </div>
    </AnimatedCard>
  );
}

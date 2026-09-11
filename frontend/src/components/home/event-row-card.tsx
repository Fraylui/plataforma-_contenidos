import Link from "next/link";
import type { EventSummary } from "@/lib/api/types";
import { formatEventDateTime } from "@/lib/content-labels";

/**
 * Evento en fila para el home: bloque de fecha (día + mes) en acento a la
 * izquierda, título y lugar a la derecha. La fecha ES el dato principal de
 * un evento, así que va como pieza visual, no como texto chico al pie.
 */
export function EventRowCard({ event, categoryName }: { event: EventSummary; categoryName?: string }) {
  const start = new Date(event.startsAt);
  const day = new Intl.DateTimeFormat("es-PE", { day: "numeric" }).format(start);
  const month = new Intl.DateTimeFormat("es-PE", { month: "short" }).format(start).replace(".", "");

  return (
    <Link
      href={`/eventos/${event.slug}`}
      className="flex items-center gap-3 rounded-2xl border border-canvas-border bg-surface p-3 shadow-sm transition-[border-color,box-shadow] hover:border-accent/60 hover:shadow-md sm:gap-4 sm:p-4"
    >
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-accent text-accent-foreground sm:h-16 sm:w-16">
        <span className="text-xl font-bold leading-none sm:text-2xl">{day}</span>
        <span className="mt-1 text-[10px] font-semibold tracking-wider uppercase sm:text-[11px]">{month}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 sm:gap-1">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground sm:text-base">{event.title}</h3>
        {event.excerpt && <p className="hidden text-[13px] leading-relaxed text-muted line-clamp-2 sm:block">{event.excerpt}</p>}
        <span className="text-[11px] text-muted sm:text-xs">
          <time dateTime={event.startsAt}>{formatEventDateTime(event.startsAt)}</time>
          {event.venueName && ` · ${event.venueName}`}
          {!event.venueName && categoryName && ` · ${categoryName}`}
        </span>
      </div>
    </Link>
  );
}

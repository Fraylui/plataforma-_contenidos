import Link from "next/link";
import type { EventSummary } from "@/lib/api/types";
import { formatEventDateTime } from "@/lib/content-labels";
import { cn } from "@/lib/utils";

/**
 * Evento en fila: bloque de fecha (día + mes) en acento a la izquierda,
 * título y lugar a la derecha. La fecha ES el dato principal de un evento,
 * así que va como pieza visual, no como texto chico al pie.
 * `compact` (barra lateral del home): sin resumen y con bloque de fecha más
 * chico, para que la agenda entre en una columna angosta sin comerse la
 * página. `bordered=false` la usa dentro de un panel que ya tiene su propio
 * borde exterior (ver HomeSidebar) — una tarjeta dentro de otra tarjeta
 * duplica el borde y se ve pesado, así que ahí la fila queda "plana" y la
 * separación entre eventos la da el divide-y del panel, no cada fila.
 */
export function EventRowCard({
  event,
  categoryName,
  compact = false,
  bordered = true,
}: {
  event: EventSummary;
  categoryName?: string;
  compact?: boolean;
  bordered?: boolean;
}) {
  const start = new Date(event.startsAt);
  const day = new Intl.DateTimeFormat("es-PE", { day: "numeric" }).format(start);
  const month = new Intl.DateTimeFormat("es-PE", { month: "short" }).format(start).replace(".", "");

  return (
    <Link
      href={`/eventos/${event.slug}`}
      className={cn(
        "flex items-center gap-3 transition-colors",
        bordered
          ? "rounded-2xl border border-foreground/[0.06] bg-surface shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_8px_20px_-12px_rgb(0_0_0_/_0.08)] hover:border-accent/50 hover:shadow-md"
          : "-mx-1 rounded-xl px-1 hover:bg-canvas",
        compact ? "p-2.5" : "p-3 sm:gap-4 sm:p-4",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 flex-col overflow-hidden rounded-lg border border-foreground/[0.08] bg-surface text-center",
          compact ? "h-12 w-11" : "h-14 w-13 sm:h-16 sm:w-14",
        )}
      >
        <span className="bg-accent py-0.5 text-[9px] font-bold tracking-wider text-accent-foreground uppercase sm:text-[10px]">
          {month}
        </span>
        <span className={cn("flex flex-1 items-center justify-center font-bold leading-none text-foreground", compact ? "text-base" : "text-lg sm:text-xl")}>
          {day}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 sm:gap-1">
        <h3 className={cn("line-clamp-2 font-semibold leading-snug text-foreground", compact ? "text-sm" : "text-[15px] sm:text-base")}>
          {event.title}
        </h3>
        {!compact && event.excerpt && (
          <p className="hidden text-[13px] leading-relaxed text-muted line-clamp-2 sm:block">{event.excerpt}</p>
        )}
        <span className="text-[11px] text-muted sm:text-xs">
          <time dateTime={event.startsAt}>{formatEventDateTime(event.startsAt)}</time>
          {event.venueName && ` · ${event.venueName}`}
          {!event.venueName && categoryName && ` · ${categoryName}`}
        </span>
      </div>
    </Link>
  );
}

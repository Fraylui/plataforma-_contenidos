import Link from "next/link";
import type { EventSummary } from "@/lib/api/types";
import { formatEventDateTime } from "@/lib/content-labels";
import { serverImageUrl } from "@/lib/server-image-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { cn } from "@/lib/utils";

function Thumb({ event, size }: { event: EventSummary; size: "sm" | "md" }) {
  const dim = size === "sm" ? "h-14 w-14" : "h-16 w-16";
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-xl bg-canvas-strong", dim)}>
      {event.coverImageId ? (
        <SkeletonImage
          src={serverImageUrl(`/api/v1/images/${event.coverImageId}/file`)}
          alt=""
          className="object-cover"
          sizes="64px"
        />
      ) : event.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- enlace externo pegado por quien redacta, host arbitrario
        <img src={event.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <NoImagePlaceholder />
      )}
    </div>
  );
}

/**
 * Evento en fila: miniatura + bloque de fecha (día + mes) en acento +
 * título/lugar. Antes era solo el bloque de fecha sin foto — en la agenda
 * del sidebar (compact) se leía como una lista de texto plana, sin nada
 * del lenguaje visual fotográfico del resto del sitio (feedback real:
 * "se ve feo, muy plano y antiguo, opaca a los contenidos" en mobile).
 * La miniatura resuelve eso sin agrandar demasiado la fila.
 *
 * `compact` (barra lateral del home): sin resumen, miniatura y bloque de
 * fecha más chicos, para que la agenda entre en una columna angosta sin
 * comerse la página. `bordered=false` la usa dentro de un panel que ya
 * tiene su propio borde exterior (ver HomeSidebar) — una tarjeta dentro de
 * otra tarjeta duplica el borde y se ve pesado, así que ahí la fila queda
 * "plana" (fondo transparente, solo hover) y la separación entre eventos
 * la da el divide-y del panel, no cada fila.
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
        "group flex items-center gap-3 transition-colors",
        bordered
          ? "rounded-2xl border border-foreground/[0.06] bg-surface shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_8px_20px_-12px_rgb(0_0_0_/_0.08)] hover:border-accent/50 hover:shadow-md"
          : "-mx-1.5 rounded-xl px-1.5 hover:bg-canvas",
        compact ? "py-2.5" : "p-3 sm:gap-4 sm:p-4",
      )}
    >
      <Thumb event={event} size={compact ? "sm" : "md"} />
      <div
        className={cn(
          "flex shrink-0 flex-col overflow-hidden rounded-lg border border-foreground/[0.08] bg-surface text-center",
          compact ? "h-11 w-10" : "h-14 w-13 sm:h-16 sm:w-14",
        )}
      >
        <span className="bg-accent py-0.5 text-[9px] font-bold tracking-wider text-accent-foreground uppercase sm:text-[10px]">
          {month}
        </span>
        <span className={cn("flex flex-1 items-center justify-center font-bold leading-none text-foreground", compact ? "text-sm" : "text-lg sm:text-xl")}>
          {day}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 sm:gap-1">
        <h3 className={cn("line-clamp-2 font-semibold leading-snug text-foreground transition-colors group-hover:text-accent", compact ? "text-sm" : "text-[15px] sm:text-base")}>
          {event.title}
        </h3>
        {!compact && event.excerpt && (
          <p className="hidden text-[13px] leading-relaxed text-muted line-clamp-2 sm:block">{event.excerpt}</p>
        )}
        <span className="truncate text-[11px] text-muted sm:text-xs">
          <time dateTime={event.startsAt}>{formatEventDateTime(event.startsAt)}</time>
          {event.venueName && ` · ${event.venueName}`}
          {!event.venueName && categoryName && ` · ${categoryName}`}
        </span>
      </div>
    </Link>
  );
}

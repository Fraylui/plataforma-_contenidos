import Link from "next/link";
import { CaretRight, Confetti } from "@phosphor-icons/react/dist/ssr";
import type { EventSummary } from "@/lib/api/types";
import { formatAgendaDate } from "@/lib/agenda-date";
import { serverImageUrl } from "@/lib/server-image-url";
import { SkeletonImage } from "@/components/ui/skeleton-image";

/**
 * «Hoy se celebra» (spec 2026-10-16), como el Doodle de Google o el «un día
 * como hoy» de History: solo aparece el día que toca una fecha de la Agenda
 * (28 de julio, Batalla de Ayacucho, Canción Criolla). La primera va como
 * tarjeta con su foto; si hay más, quedan como enlaces debajo. Sin fechas
 * hoy no se dibuja nada (nunca un hueco).
 */
export function TodayDates({ dates }: { dates: EventSummary[] }) {
  if (dates.length === 0) return null;
  const [main, ...rest] = dates;
  const cover = main.coverImageId ? serverImageUrl(`/api/v1/images/${main.coverImageId}/file`) : null;

  return (
    <section aria-labelledby="hoy-se-celebra" className="mb-3">
      <Link
        href={`/agenda/${main.slug}`}
        className="group relative flex min-h-36 overflow-hidden rounded-card bg-linear-to-br from-accent-fill to-emerald-700 shadow-card focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
      >
        {cover ? (
          <SkeletonImage src={cover} alt="" className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(min-width: 640px) 630px, 100vw" />
        ) : main.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- enlace externo pegado por quien redacta, host arbitrario
          <img src={main.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        {/* Degradado para leer el texto blanco sobre cualquier foto (contraste AA). */}
        <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/10" />
        <span className="relative mt-auto flex w-full items-end justify-between gap-3 p-4 text-white">
          <span className="min-w-0">
            <span id="hoy-se-celebra" className="flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
              <Confetti className="size-4" weight="fill" aria-hidden="true" />
              Hoy se celebra
            </span>
            <span className="mt-1 block text-xl leading-tight font-extrabold tracking-tight">{main.title}</span>
            <span className="mt-0.5 block text-sm text-white/85">
              {formatAgendaDate({ at: main.nextOccurrenceAt, allDay: main.allDay, recursYearly: main.recursYearly, sinceYear: main.sinceYear })}
            </span>
          </span>
          <CaretRight className="size-5 shrink-0" weight="bold" aria-hidden="true" />
        </span>
      </Link>
      {rest.length > 0 && (
        <p className="mt-2 px-1 text-sm text-muted">
          También hoy:{" "}
          {rest.map((date, i) => (
            <span key={date.id}>
              {i > 0 && ", "}
              <Link href={`/agenda/${date.slug}`} className="font-semibold text-foreground hover:underline">
                {date.title}
              </Link>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}

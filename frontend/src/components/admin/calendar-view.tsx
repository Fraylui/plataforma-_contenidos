import Link from "next/link";
import { CaretLeft, CaretRight, CheckCircle, Clock, Confetti } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { LinkButton } from "@/components/ui";
import { CONTENT_TYPE_INFO } from "@/lib/admin/dashboard";
import { entriesByDay, monthLabel, monthWeeks, shiftMonth } from "@/lib/admin/calendar";
import type { CalendarEntry, CalendarEntryKind } from "@/lib/api/admin-types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MAX_PER_CELL = 3;

const KIND: Record<CalendarEntryKind, { label: string; icon: Icon; className: string }> = {
  SCHEDULED: { label: "Programado", icon: Clock, className: "bg-info-soft text-info" },
  PUBLISHED: { label: "Publicado", icon: CheckCircle, className: "bg-success-soft text-success" },
  CELEBRATION_DATE: { label: "Fecha especial", icon: Confetti, className: "bg-accent-soft text-accent" },
};

function hrefFor(month: string) {
  return `/admin/calendario?mes=${month}`;
}

function dayNumber(day: string) {
  return Number(day.slice(8));
}

function longDay(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

function EntryLink({ entry, compact = false }: { entry: CalendarEntry; compact?: boolean }) {
  const kind = KIND[entry.kind];
  const KindIcon = kind.icon;
  const typeLabel = CONTENT_TYPE_INFO[entry.type]?.label ?? "";
  return (
    <Link
      href={`${CONTENT_TYPE_INFO[entry.type].adminPath}/${entry.id}`}
      title={`${kind.label}${entry.time ? ` · ${entry.time}` : ""} · ${typeLabel}: ${entry.title}`}
      className={cn(
        "flex min-w-0 items-center gap-1.5 rounded-control outline-none transition-opacity hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring",
        kind.className,
        compact ? "px-1.5 py-0.5 text-[11px] font-medium" : "px-3 py-2 text-sm",
      )}
    >
      <KindIcon weight="fill" className={cn("shrink-0", compact ? "size-3" : "size-4")} aria-hidden="true" />
      <span className="sr-only">{kind.label}: </span>
      {entry.time && <span className="shrink-0 tabular-nums">{entry.time}</span>}{" "}
      <span className="truncate">{entry.title}</span>{" "}
      {!compact && <span className="ml-auto shrink-0 text-xs opacity-80">{typeLabel}</span>}
    </Link>
  );
}

/**
 * Calendario de publicaciones del panel. En computadora, la cuadrícula del
 * mes; en celular, solo los días con algo, en lista. Cada entrada abre su
 * contenido para editarlo.
 */
export function CalendarView({
  month,
  today,
  entries,
  canCreate,
}: {
  month: string;
  today: string;
  entries: CalendarEntry[];
  canCreate: boolean;
}) {
  const byDay = entriesByDay(entries);
  const weeks = monthWeeks(month);
  const daysWithEntries = [...byDay.keys()].sort();
  const label = monthLabel(month);

  return (
    <div>
      <AdminPageHeader
        title="Calendario"
        description="Lo que publicaste, lo que está programado y las fechas especiales que se acercan, para preparar el contenido antes del día."
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LinkButton href={hrefFor(shiftMonth(month, -1))} variant="secondary" size="sm" icon={<CaretLeft aria-hidden="true" />}>
            <span className="sr-only sm:not-sr-only">Mes anterior</span>
          </LinkButton>
          <h2 className="min-w-40 text-center text-lg font-semibold text-foreground first-letter:uppercase" aria-live="polite">
            {label}
          </h2>
          <LinkButton href={hrefFor(shiftMonth(month, 1))} variant="secondary" size="sm">
            <span className="sr-only sm:not-sr-only">Mes siguiente</span>
            <CaretRight aria-hidden="true" />
          </LinkButton>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {today.slice(0, 7) !== month && (
            <Link href="/admin/calendario" className="text-sm font-medium text-accent hover:underline">
              Ir a hoy
            </Link>
          )}
          <ul className="flex flex-wrap gap-2 text-xs" aria-label="Qué significa cada color">
            {Object.values(KIND).map(({ label: kindLabel, icon: KindIcon, className }) => (
              <li key={kindLabel} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium", className)}>
                <KindIcon weight="fill" className="size-3" aria-hidden="true" />
                {kindLabel}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Computadora: cuadrícula del mes. */}
      <div className="mt-4 hidden overflow-hidden rounded-card border border-border bg-surface md:block">
        <div className="grid grid-cols-7 border-b border-border bg-field/50 text-xs font-semibold text-muted">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-2 py-2 text-center">
              {day}
            </div>
          ))}
        </div>
        {weeks.map((week, i) => (
          <div key={i} className="grid grid-cols-7 border-b border-border last:border-b-0">
            {week.map((day, j) => {
              const dayEntries = day ? (byDay.get(day) ?? []) : [];
              const isToday = day === today;
              return (
                <div key={day ?? `empty-${i}-${j}`} className={cn("min-h-28 border-r border-border p-1.5 last:border-r-0", !day && "bg-field/30")}>
                  {day && (
                    <>
                      <span
                        className={cn(
                          "mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                          isToday ? "bg-accent-fill text-accent-foreground" : "text-muted",
                        )}
                        aria-label={isToday ? `Hoy, ${longDay(day)}` : longDay(day)}
                      >
                        {dayNumber(day)}
                      </span>
                      <ul className="space-y-1">
                        {dayEntries.slice(0, MAX_PER_CELL).map((entry) => (
                          <li key={`${entry.kind}-${entry.id}`}>
                            <EntryLink entry={entry} compact />
                          </li>
                        ))}
                      </ul>
                      {dayEntries.length > MAX_PER_CELL && (
                        <p className="mt-1 px-1 text-[11px] text-muted">y {dayEntries.length - MAX_PER_CELL} más</p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Celular (y lista completa en computadora cuando hay más de lo que cabe): día por día. */}
      <div className="mt-4 md:hidden">
        {daysWithEntries.length === 0 ? null : (
          <ol className="space-y-4">
            {daysWithEntries.map((day) => (
              <li key={day}>
                <h3 className={cn("mb-2 text-sm font-semibold first-letter:uppercase", day === today ? "text-accent" : "text-foreground")}>
                  {day === today ? `Hoy, ${longDay(day)}` : longDay(day)}
                </h3>
                <ul className="space-y-1.5">
                  {(byDay.get(day) ?? []).map((entry) => (
                    <li key={`${entry.kind}-${entry.id}`}>
                      <EntryLink entry={entry} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>

      {entries.length === 0 && (
        <p className="mt-4 rounded-card border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
          Nada publicado ni programado en {label}.
          {canCreate && " Usa el botón «Crear» y, al publicar, elige «Programar» para que aparezca aquí."}
        </p>
      )}
    </div>
  );
}

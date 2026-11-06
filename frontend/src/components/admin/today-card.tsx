import Link from "next/link";
import { CalendarBlank, Clock, Confetti, PencilSimpleLine } from "@phosphor-icons/react/dist/ssr";
import { CONTENT_TYPE_INFO } from "@/lib/admin/dashboard";
import { daysBetween, whenLabel } from "@/lib/admin/calendar";
import type { CalendarToday } from "@/lib/api/admin-types";

const SECTION_TITLE = "mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase";
const ROW = "flex items-center gap-3 rounded-control px-2 py-2 outline-none transition-colors hover:bg-field focus-visible:ring-[3px] focus-visible:ring-ring";

/**
 * «Qué hacer hoy»: lo primero al entrar al panel. Fechas especiales que se
 * acercan (con un atajo para crear contenido para esa fecha), lo programado
 * para hoy y los borradores para retomar. Sin nada que mostrar, invita a crear.
 */
export function TodayCard({ data, canCreatePublication }: { data: CalendarToday; canCreatePublication: boolean }) {
  const { today, upcomingDates, scheduledToday, drafts } = data;
  const empty = upcomingDates.length === 0 && scheduledToday.length === 0 && drafts.length === 0;

  return (
    <section aria-labelledby="que-hacer-hoy" className="rounded-card bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="que-hacer-hoy" className="text-lg font-bold text-foreground">
          Qué hacer hoy
        </h2>
        <Link href="/admin/calendario" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
          <CalendarBlank aria-hidden="true" className="size-4" />
          Ver calendario
        </Link>
      </div>

      {empty && (
        <p className="mt-3 text-sm text-muted">
          Nada pendiente. Un buen momento para crear algo nuevo con el botón «Crear».
        </p>
      )}

      <div className="mt-4 grid gap-6 md:grid-cols-3">
        {upcomingDates.length > 0 && (
          <div>
            <h3 className={SECTION_TITLE}>
              <Confetti aria-hidden="true" className="size-4 text-accent" />
              Se acerca
            </h3>
            <ul className="space-y-1">
              {upcomingDates.map((date) => (
                <li key={`${date.id}-${date.date}`} className="rounded-control px-2 py-2">
                  <p className="text-xs font-semibold text-accent">{whenLabel(daysBetween(today, date.date))}</p>
                  <p className="text-sm font-medium text-foreground">{date.title}</p>
                  {canCreatePublication && (
                    <Link href="/admin/publicaciones/nuevo" className="mt-0.5 inline-block text-xs font-medium text-accent hover:underline">
                      Crear una publicación para esta fecha
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {scheduledToday.length > 0 && (
          <div>
            <h3 className={SECTION_TITLE}>
              <Clock aria-hidden="true" className="size-4 text-info" />
              Sale hoy
            </h3>
            <ul className="space-y-1">
              {scheduledToday.map((entry) => (
                <li key={entry.id}>
                  <Link href={`${CONTENT_TYPE_INFO[entry.type].adminPath}/${entry.id}`} className={ROW}>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-info">{entry.time}</span>{" "}
                    <span className="min-w-0 truncate text-sm text-foreground">{entry.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {drafts.length > 0 && (
          <div>
            <h3 className={SECTION_TITLE}>
              <PencilSimpleLine aria-hidden="true" className="size-4" />
              Para terminar
            </h3>
            <ul className="space-y-1">
              {drafts.map((draft) => (
                <li key={draft.id}>
                  <Link href={`${CONTENT_TYPE_INFO[draft.type].adminPath}/${draft.id}`} className={ROW}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{draft.title || "Sin título"}</span>
                      <span className="block text-xs text-muted">{CONTENT_TYPE_INFO[draft.type].label} · borrador</span>
                    </span>{" "}
                    <span className="shrink-0 text-xs font-semibold text-accent">Continuar</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

import type { Icon } from "@phosphor-icons/react";
import {
  CheckCircle,
  Key,
  Pulse,
  PencilSimple,
  Plus,
  SignIn,
  SlidersHorizontal,
  Trash,
  UserGear,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import type { AuditEvent } from "@/lib/api/admin-types";
import { describeAuditAction, parseAuditDetails, RESOURCE_LABELS } from "@/lib/admin/audit";
import { Badge } from "@/components/ui";
import { SITE_TIME_ZONE } from "@/lib/site-time-zone";

const DAY_KEY = new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const DAY_LABEL = new Intl.DateTimeFormat("es-PE", { timeZone: SITE_TIME_ZONE, weekday: "long", day: "numeric", month: "long" });
const TIME = new Intl.DateTimeFormat("es-PE", { timeZone: SITE_TIME_ZONE, hour: "numeric", minute: "2-digit" });

/** Ícono por palabra clave del código real — no depende de un enum cerrado en el frontend. */
function actionIcon(event: AuditEvent): Icon {
  const a = event.action.toUpperCase();
  if (event.result === "FAILURE" || a.includes("FAIL") || a.includes("INVALID") || a.includes("DENIED")) return Warning;
  if (a.includes("LOGIN")) return SignIn;
  if (a.includes("TOKEN") || a.includes("PASSWORD")) return Key;
  if (a.includes("PERMISSION") || a.startsWith("WORKER")) return UserGear;
  if (a.includes("SETTING")) return SlidersHorizontal;
  if (a.includes("DELETE") || a.includes("REMOV") || a.includes("PURGED")) return Trash;
  if (a.includes("CREATE") || a.includes("UPLOAD")) return Plus;
  if (a.includes("PUBLISH")) return CheckCircle;
  if (a.includes("UPDATE") || a.startsWith("PUT") || a.startsWith("PATCH")) return PencilSimple;
  return Pulse;
}

/** "Hoy", "Ayer" o el día, en la zona horaria del sitio (no la del servidor). */
function dayLabel(iso: string, now: Date): string {
  const key = DAY_KEY.format(new Date(iso));
  if (key === DAY_KEY.format(now)) return "Hoy";
  if (key === DAY_KEY.format(new Date(now.getTime() - 86_400_000))) return "Ayer";
  const label = DAY_LABEL.format(new Date(iso));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Registro de actividad como línea de tiempo agrupada por día. `detailed`
 * (página Actividad) agrega recurso, IP, resultado y el detalle "antes →
 * después" desplegable; sin él (inicio) solo la frase, quién y la hora.
 */
export function AuditTimeline({ events, detailed = false }: { events: AuditEvent[]; detailed?: boolean }) {
  const now = new Date();
  return (
    <ol className="space-y-1">
      {events.map((event, index) => {
        const ActionIcon = actionIcon(event);
        const failed = event.result === "FAILURE";
        const day = dayLabel(event.occurredAt, now);
        const showDay = index === 0 || dayLabel(events[index - 1].occurredAt, now) !== day;
        const details = detailed ? parseAuditDetails(event.details) : [];
        return (
          <li key={event.id}>
            {showDay && (
              <p className={`${index === 0 ? "" : "mt-4"} mb-2 text-[11px] font-semibold tracking-wide text-muted uppercase`}>{day}</p>
            )}
            <div className="flex items-start gap-3 rounded-lg px-1 py-1.5">
              <span
                className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
                  failed ? "bg-danger-soft text-danger-ink" : "bg-field text-muted"
                }`}
              >
                <ActionIcon className="size-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{describeAuditAction(event.action)}</span>
                  {detailed && event.resourceType && (
                    <span className="text-muted"> · {RESOURCE_LABELS[event.resourceType] ?? event.resourceType}</span>
                  )}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <span>{event.actorEmail ?? "Sistema"}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={event.occurredAt}>{TIME.format(new Date(event.occurredAt))}</time>
                  {detailed && event.ipAddress && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{event.ipAddress}</span>
                    </>
                  )}
                  {detailed && failed && <Badge tone="danger" dot>Fallo</Badge>}
                </p>
                {details.length > 0 && (
                  <details className="group mt-2">
                    <summary className="cursor-pointer text-xs font-medium text-accent hover:underline">Ver cambios</summary>
                    <ul className="mt-2 space-y-1 rounded-lg bg-background p-3 text-xs">
                      {details.map((detail, i) =>
                        detail.kind === "change" ? (
                          <li key={i} className="flex flex-wrap items-center gap-1.5">
                            <span className="font-medium text-foreground">{detail.label}:</span>
                            <span className="text-muted line-through">{detail.from}</span>
                            <span aria-label="pasó a">→</span>
                            <span className="font-semibold text-foreground">{detail.to}</span>
                          </li>
                        ) : (
                          <li key={i} className="text-muted">{detail.text}</li>
                        ),
                      )}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

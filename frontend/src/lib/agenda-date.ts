import { SITE_TIME_ZONE } from "@/lib/site-time-zone";
import { formatEventDateTime, formatShortDate } from "@/lib/content-labels";

export interface AgendaDate {
  /** Próxima vez que toca (ISO). */
  at: string;
  allDay: boolean;
  recursYearly: boolean;
  sinceYear?: number | null;
}

const DAY_MONTH = new Intl.DateTimeFormat("es-PE", { timeZone: SITE_TIME_ZONE, day: "numeric", month: "long" });
const DAY = new Intl.DateTimeFormat("es-PE", { timeZone: SITE_TIME_ZONE, day: "numeric" });
const SHORT_MONTH = new Intl.DateTimeFormat("es-PE", { timeZone: SITE_TIME_ZONE, month: "short" });

/**
 * Fecha de la Agenda, siempre absoluta (memoria: fechas absolutas en la
 * Agenda): la que se repite cada año va sin año («28 de julio · desde
 * 1821»), una única de todo el día con su año y sin hora, y una con hora
 * como hasta ahora.
 */
export function formatAgendaDate(date: AgendaDate): string {
  if (date.recursYearly) {
    const dayMonth = DAY_MONTH.format(new Date(date.at));
    return date.sinceYear ? `${dayMonth} · desde ${date.sinceYear}` : dayMonth;
  }
  return date.allDay ? formatShortDate(date.at) : formatEventDateTime(date.at);
}

const PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: SITE_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Cuánto se adelanta la zona del sitio respecto de UTC en ese instante (ms; Lima = −5 h). */
function siteOffsetMs(utcMs: number): number {
  const p = Object.fromEntries(PARTS.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return asUtc - utcMs;
}

/**
 * «2026-07-28» → la medianoche de ese día en la zona del sitio (ISO). Una
 * fecha de todo el día es del sitio, no del navegador de quien la carga: si
 * un trabajador está en otro país, el 28 de julio sigue siendo el 28 en Lima.
 */
export function siteMidnightIso(date: string): string {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  const guess = Date.UTC(year, month - 1, day);
  return new Date(guess - siteOffsetMs(guess)).toISOString();
}

/** ISO → «2026-07-28», el día en la zona del sitio (para volver a cargar el campo de fecha). */
export function siteDateString(iso: string): string {
  const p = Object.fromEntries(PARTS.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

/** Día y mes corto («28», «jul») para el cuadrito de fecha de las listas. */
export function agendaDateParts(iso: string): { day: string; month: string } {
  const date = new Date(iso);
  return { day: DAY.format(date), month: SHORT_MONTH.format(date).replace(".", "").toLowerCase() };
}

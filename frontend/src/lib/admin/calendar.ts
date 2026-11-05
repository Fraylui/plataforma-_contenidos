import type { CalendarEntry } from "@/lib/api/admin-types";

/** Mes AAAA-MM válido de la URL, o null (la página usa entonces el mes actual). */
export function parseCalendarMonth(value: string | string[] | undefined): string | null {
  const month = Array.isArray(value) ? value[0] : value;
  if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null;
  const year = Number(month.slice(0, 4));
  return year >= 2000 && year <= 2100 ? month : null;
}

/** Mes actual (AAAA-MM) en la zona horaria del sitio. */
export function currentMonth(timeZone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit" }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}`;
}

/** Hoy (AAAA-MM-DD) en la zona horaria del sitio. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Mes anterior o siguiente: shiftMonth("2026-01", -1) → "2025-12". */
export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const index = year * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** «noviembre de 2026». */
export function monthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, m - 1, 1)));
}

/**
 * Semanas del mes, de lunes a domingo, con null en los huecos antes del día 1
 * y después del último día. Cada día es AAAA-MM-DD.
 */
export function monthWeeks(month: string): Array<Array<string | null>> {
  const [year, m] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const firstWeekday = (new Date(Date.UTC(year, m - 1, 1)).getUTCDay() + 6) % 7; // lunes = 0
  const cells: Array<string | null> = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= days; day++) cells.push(`${month}-${String(day).padStart(2, "0")}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: Array<Array<string | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Entradas agrupadas por día (el backend ya las manda ordenadas). */
export function entriesByDay(entries: CalendarEntry[]): Map<string, CalendarEntry[]> {
  const byDay = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    const list = byDay.get(entry.date);
    if (list) list.push(entry);
    else byDay.set(entry.date, [entry]);
  }
  return byDay;
}

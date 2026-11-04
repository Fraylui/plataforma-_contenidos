import type { OnThisDayItem } from "@/lib/api/types";

/** Zona del contenido (CONTEXTO.md 1.2): "hoy" es el día en Lima. */
export const PLATFORM_TIME_ZONE = "America/Lima";

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Fecha de hoy en Lima como YYYY-MM-DD (parámetro del endpoint y clave de caché del día). */
export function todayInPlatformZone(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PLATFORM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** "9 de diciembre" o "9 de diciembre de 1824" — día y mes vienen del contenido, no del calendario. */
export function formatMemorableDate(day: number, month: number, year?: number | null): string {
  const base = `${day} de ${MONTHS[month - 1]}`;
  return year ? `${base} de ${year}` : base;
}

/** Línea corta sobre la tarjeta: cuándo cae y, si se sabe, hace cuántos años pasó. */
export function onThisDayKicker(item: OnThisDayItem): string {
  const when = item.daysUntil === 0 ? "Hoy" : item.daysUntil === 1 ? "Mañana" : `En ${item.daysUntil} días`;
  if (item.yearsAgo != null && item.yearsAgo > 0) {
    return `${when} · hace ${item.yearsAgo} ${item.yearsAgo === 1 ? "año" : "años"}`;
  }
  return when;
}

/** Título de la franja: "Un día como hoy" solo si de verdad hay algo de hoy. */
export function onThisDayTitle(items: OnThisDayItem[]): string {
  return items.some((item) => item.daysUntil === 0) ? "Un día como hoy" : "Se recuerda esta semana";
}

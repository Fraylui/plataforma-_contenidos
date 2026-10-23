import type { CampaignDailyStat } from "@/lib/api/admin-types";

const PERCENT = new Intl.NumberFormat("es-PE", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function ctr(clicks: number, impressions: number): string {
  return impressions > 0 ? PERCENT.format(clicks / impressions) : "—";
}

/** Tasa de reproducción del video: reproducciones ÷ impresiones visibles. */
export function playRate(plays: number, impressions: number): string {
  return impressions > 0 ? PERCENT.format(plays / impressions) : "—";
}

/** Rellena los días sin datos con 0: el eje es tiempo continuo, un día sin vistas también es un dato. */
export function fillDays(stats: CampaignDailyStat[], days: number, today = new Date()): CampaignDailyStat[] {
  const byDay = new Map(stats.map((s) => [s.day, s]));
  const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(end - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    return byDay.get(day) ?? { day, impressions: 0, clicks: 0, plays: 0 };
  });
}

export interface PeriodTotals {
  impressions: number;
  clicks: number;
  plays: number;
}

function sum(days: CampaignDailyStat[]): PeriodTotals {
  return days.reduce(
    (total, d) => ({ impressions: total.impressions + d.impressions, clicks: total.clicks + d.clicks, plays: total.plays + d.plays }),
    { impressions: 0, clicks: 0, plays: 0 },
  );
}

/**
 * Reporte de un período: los días elegidos (para el gráfico) y los totales
 * de ese período y del anterior del mismo largo (para la variación). Pide
 * al backend el doble de días (ver la página de la campaña).
 */
export function reportPeriods(stats: CampaignDailyStat[], range: number, today = new Date()) {
  const all = fillDays(stats, range * 2, today);
  const days = all.slice(range);
  return { days, current: sum(days), previous: sum(all.slice(0, range)) };
}

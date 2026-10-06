import type { CampaignDailyStat } from "@/lib/api/admin-types";

const PERCENT = new Intl.NumberFormat("es-PE", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function ctr(clicks: number, impressions: number): string {
  return impressions > 0 ? PERCENT.format(clicks / impressions) : "—";
}

/** Rellena los días sin datos con 0: el eje es tiempo continuo, un día sin vistas también es un dato. */
export function fillDays(stats: CampaignDailyStat[], days: number, today = new Date()): CampaignDailyStat[] {
  const byDay = new Map(stats.map((s) => [s.day, s]));
  const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(end - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    return byDay.get(day) ?? { day, impressions: 0, clicks: 0 };
  });
}

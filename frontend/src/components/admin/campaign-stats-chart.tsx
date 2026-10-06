"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CampaignDailyStat } from "@/lib/api/admin-types";
import { ctr } from "@/lib/ads/campaign-report";

const DATE_SHORT = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", timeZone: "UTC" });
const DATE_LONG = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
/**
 * Impresiones visibles por día — una sola serie, un solo tono (--accent),
 * sin leyenda (el título la nombra). Los clics y el porcentaje de clics van
 * en el tooltip y en la tabla: tienen otra escala y un segundo eje Y
 * confundiría (regla de un solo eje).
 */
export function CampaignStatsChart({ data }: { data: CampaignDailyStat[] }) {
  const chartData = data.map((d) => ({ ...d, label: DATE_SHORT.format(new Date(`${d.day}T00:00:00Z`)) }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barCategoryGap={2}>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          interval="preserveStartEnd"
          minTickGap={32}
        />
        <YAxis hide allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "var(--accent-soft)" }}
          content={({ active, payload }) => {
            const row = payload?.[0]?.payload as CampaignDailyStat | undefined;
            if (!active || !row) return null;
            return (
              <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground shadow-sm">
                <p className="mb-1 font-semibold capitalize">{DATE_LONG.format(new Date(`${row.day}T00:00:00Z`))}</p>
                <p>{row.impressions} impresiones visibles</p>
                <p>
                  {row.clicks} clics · {ctr(row.clicks, row.impressions)}
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="impressions" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={18} minPointSize={0} />
      </BarChart>
    </ResponsiveContainer>
  );
}

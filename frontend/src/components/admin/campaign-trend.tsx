"use client";

import { useState } from "react";
import type { CampaignDailyStat } from "@/lib/api/admin-types";
import { DailyAreaChart } from "@/components/admin/dashboard-charts";
import { SegmentedControl } from "@/components/ui/segmented-control";

type Metric = "impressions" | "clicks" | "plays";

const LABELS: Record<Metric, string> = {
  impressions: "Impresiones visibles",
  clicks: "Clics",
  plays: "Reproducciones",
};

/**
 * Evolución diaria de la campaña: una métrica a la vez (un solo eje; las
 * impresiones y los clics tienen escalas muy distintas y juntas engañan).
 * Se elige con el control de arriba; el tooltip da el valor de cada día.
 */
export function CampaignTrend({ days, hasVideo }: { days: CampaignDailyStat[]; hasVideo: boolean }) {
  const [metric, setMetric] = useState<Metric>("impressions");
  const options = (hasVideo ? ["impressions", "clicks", "plays"] : ["impressions", "clicks"]) as Metric[];
  const values = days.map((d) => ({ day: d.day, value: d[metric] }));
  const empty = values.every((v) => v.value === 0);

  return (
    <div>
      <SegmentedControl
        label="Métrica del gráfico"
        options={options.map((value) => ({ value, label: LABELS[value] }))}
        value={metric}
        onChange={setMetric}
      />
      {empty ? (
        <p className="mt-4 rounded-control bg-field px-4 py-8 text-center text-sm text-muted">
          Sin {LABELS[metric].toLowerCase()} en este período.
        </p>
      ) : (
        <div className="mt-3">
          <DailyAreaChart data={values} label={LABELS[metric]} />
        </div>
      )}
    </div>
  );
}

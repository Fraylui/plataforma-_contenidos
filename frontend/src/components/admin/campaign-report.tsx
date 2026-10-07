import { Eye, CursorClick, Percent } from "@phosphor-icons/react/dist/ssr";
import type { Campaign, CampaignDailyStat } from "@/lib/api/admin-types";
import { ctr, fillDays } from "@/lib/ads/campaign-report";
import { StatCard } from "@/components/admin/ui";
import { CampaignStatsChart } from "@/components/admin/campaign-stats-chart";
import { Card } from "@/components/ui";

const REPORT_DAYS = 30;
const DATE = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", timeZone: "UTC" });

/**
 * Reporte para el anunciante: lo que justifica cobrarle. Impresiones
 * VISIBLES (50 % del anuncio en pantalla durante 1 s, estándar MRC) y
 * clics válidos (sin robots ni repeticiones) — no "veces que se pidió".
 */
export function CampaignReport({ campaign, stats }: { campaign: Campaign; stats: CampaignDailyStat[] }) {
  const days = fillDays(stats, REPORT_DAYS);
  const recent = days.filter((d) => d.impressions > 0 || d.clicks > 0).reverse();

  return (
    <Card title="Rendimiento">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Impresiones visibles" value={campaign.impressionCount} icon={Eye} accent hint="Desde que empezó la campaña" />
        <StatCard label="Clics" value={campaign.clickCount} icon={CursorClick} hint="Sin robots ni clics repetidos" />
        <StatCard
          label="Porcentaje de clics"
          value={ctr(campaign.clickCount, campaign.impressionCount)}
          icon={Percent}
          hint="Clics ÷ impresiones (CTR)"
        />
      </div>

      <div>
        <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
          Impresiones visibles por día — últimos {REPORT_DAYS} días (UTC)
        </h3>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Todavía no hay vistas registradas en este período.</p>
        ) : (
          <>
            <CampaignStatsChart data={days} />
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-xs font-medium text-muted hover:text-foreground">Ver como tabla</summary>
              <table className="mt-2 w-full text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="py-1.5 font-medium">Día</th>
                    <th className="py-1.5 text-right font-medium">Impresiones</th>
                    <th className="py-1.5 text-right font-medium">Clics</th>
                    <th className="py-1.5 text-right font-medium">% de clics</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {recent.map((d) => (
                    <tr key={d.day} className="border-t border-border/60">
                      <td className="py-1.5">{DATE.format(new Date(`${d.day}T00:00:00Z`))}</td>
                      <td className="py-1.5 text-right">{d.impressions}</td>
                      <td className="py-1.5 text-right">{d.clicks}</td>
                      <td className="py-1.5 text-right">{ctr(d.clicks, d.impressions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </div>
    </Card>
  );
}

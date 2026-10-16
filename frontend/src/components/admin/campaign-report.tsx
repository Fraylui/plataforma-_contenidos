import { CursorClick, Eye, Percent, PlayCircle } from "@phosphor-icons/react/dist/ssr";
import type { Campaign, CampaignDailyStat, DashboardRange } from "@/lib/api/admin-types";
import { ctr, playRate, reportPeriods } from "@/lib/ads/campaign-report";
import { KpiCard, RangeNav } from "@/components/admin/kpi";
import { CampaignTrend } from "@/components/admin/campaign-trend";
import { Card } from "@/components/ui";

const DATE = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", timeZone: "UTC" });
const NUMBER = new Intl.NumberFormat("es-PE");

/** Una tasa como entero comparable (por diez mil) para la variación frente al período anterior. */
function rate(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 10_000) : 0;
}

/**
 * Reporte para el anunciante: lo que justifica cobrarle. Impresiones
 * VISIBLES (50 % del anuncio en pantalla durante 1 s, estándar MRC) y
 * clics válidos (sin robots ni repeticiones) — no "veces que se pidió".
 * Con video (anuncio nativo): reproducciones y tasa de reproducción. Mismo
 * lenguaje que el inicio del panel: período 7/30/90 en la URL, variación
 * frente al período anterior y la forma diaria de cada indicador.
 * `stats` trae el doble de días del período (ver reportPeriods).
 */
export function CampaignReport({
  campaign,
  stats,
  range,
  hrefFor,
}: {
  campaign: Campaign;
  stats: CampaignDailyStat[];
  range: DashboardRange;
  hrefFor: (range: DashboardRange) => string;
}) {
  const { days, current, previous } = reportPeriods(stats, range);
  const hasVideo = Boolean(campaign.youtubeVideoId);
  const recent = days.filter((d) => d.impressions > 0 || d.clicks > 0 || d.plays > 0).reverse();

  return (
    <Card
      title="Rendimiento"
      description={`Desde que empezó: ${NUMBER.format(campaign.impressionCount)} impresiones visibles y ${NUMBER.format(
        campaign.clickCount,
      )} clics (${ctr(campaign.clickCount, campaign.impressionCount)}).`}
      actions={<RangeNav range={range} hrefFor={hrefFor} />}
    >
      <div className={`grid gap-4 sm:grid-cols-2 ${hasVideo ? "xl:grid-cols-5" : "xl:grid-cols-3"}`}>
        <KpiCard
          label="Impresiones visibles"
          icon={Eye}
          kpi={{ current: current.impressions, previous: previous.impressions }}
          values={days.map((d) => d.impressions)}
          rangeDays={range}
        />
        <KpiCard
          label="Clics"
          icon={CursorClick}
          kpi={{ current: current.clicks, previous: previous.clicks }}
          values={days.map((d) => d.clicks)}
          rangeDays={range}
          hint="Sin robots ni clics repetidos"
        />
        <KpiCard
          label="Porcentaje de clics"
          icon={Percent}
          kpi={{ current: rate(current.clicks, current.impressions), previous: rate(previous.clicks, previous.impressions) }}
          display={ctr(current.clicks, current.impressions)}
          values={days.map((d) => rate(d.clicks, d.impressions))}
          rangeDays={range}
        />
        {hasVideo && (
          <>
            <KpiCard
              label="Reproducciones"
              icon={PlayCircle}
              kpi={{ current: current.plays, previous: previous.plays }}
              values={days.map((d) => d.plays)}
              rangeDays={range}
            />
            <KpiCard
              label="Tasa de reproducción"
              icon={Percent}
              kpi={{ current: rate(current.plays, current.impressions), previous: rate(previous.plays, previous.impressions) }}
              display={playRate(current.plays, current.impressions)}
              values={days.map((d) => rate(d.plays, d.impressions))}
              rangeDays={range}
            />
          </>
        )}
      </div>

      <CampaignTrend days={days} hasVideo={hasVideo} />

      {recent.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-medium text-muted hover:text-foreground">Ver como tabla</summary>
          <table className="mt-2 w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1.5 font-medium">Día (UTC)</th>
                <th className="py-1.5 text-right font-medium">Impresiones</th>
                <th className="py-1.5 text-right font-medium">Clics</th>
                <th className="py-1.5 text-right font-medium">% de clics</th>
                {hasVideo && <th className="py-1.5 text-right font-medium">Reproducciones</th>}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {recent.map((d) => (
                <tr key={d.day} className="border-t border-border/60">
                  <td className="py-1.5">{DATE.format(new Date(`${d.day}T00:00:00Z`))}</td>
                  <td className="py-1.5 text-right">{d.impressions}</td>
                  <td className="py-1.5 text-right">{d.clicks}</td>
                  <td className="py-1.5 text-right">{ctr(d.clicks, d.impressions)}</td>
                  {hasVideo && <td className="py-1.5 text-right">{d.plays}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </Card>
  );
}

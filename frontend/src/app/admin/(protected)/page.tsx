import type { Metadata } from "next";
import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import {
  Globe,
  Eye,
  Heart,
  Article,
  ClockCounterClockwise,
  TrendUp,
  TrendDown,
  Megaphone,
  ArrowSquareOut,
} from "@phosphor-icons/react/dist/ssr";
import { requireAdminUser } from "@/lib/admin/auth";
import { getAdminDashboard, listAdminAuditLog } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { roleLabel } from "@/lib/admin/role-labels";
import { visibleNavItems } from "@/lib/admin/nav";
import { CONTENT_TYPE_INFO, DASHBOARD_RANGES, kpiChange, parseDashboardRange } from "@/lib/admin/dashboard";
import { ctr } from "@/lib/ads/campaign-report";
import { publicationStatusLabel, publicationStatusTone, formatPublishedDate } from "@/lib/content-labels";
import { AuditTimeline } from "@/components/admin/audit-timeline";
import { DailyAreaChart, Sparkline } from "@/components/admin/dashboard-charts";
import type { DashboardKpi, DashboardSummary } from "@/lib/api/admin-types";
import { Badge } from "@/components/ui";
import { SITE_TIME_ZONE } from "@/lib/site-time-zone";

export const metadata: Metadata = {
  title: "Panel",
  robots: "noindex,nofollow",
};

const CONTENT_HREFS = ["/admin/publicaciones", "/admin/lugares", "/admin/eventos", "/admin/galerias", "/admin/directorio"];
const NUMBER = new Intl.NumberFormat("es-PE");
const RANGE_LABEL: Record<number, string> = { 7: "7 días", 30: "30 días", 90: "90 días" };

/**
 * Inicio del panel: resumen tipo CRM en una sola llamada (GET
 * /api/v1/admin/dashboard). Período en la URL (?range=7|30|90) para que se
 * pueda compartir y volver con el botón atrás. Cada usuario ve solo lo que
 * sus permisos le dejan (lo filtra el backend).
 */
export default async function AdminDashboardPage(props: PageProps<"/admin">) {
  const { user, accessToken } = await requireAdminUser();
  const range = parseDashboardRange((await props.searchParams).range);
  const allowedHrefs = new Set(visibleNavItems(user).map((item) => item.href));
  const canSeeContent = CONTENT_HREFS.some((href) => allowedHrefs.has(href));
  const canSeeAudit = allowedHrefs.has("/admin/actividad");
  const canSeeStats = allowedHrefs.has("/admin/estadisticas");

  const [dashboardResult, auditResult] = await Promise.all([
    canSeeContent ? fetchOrAccessDenied(() => getAdminDashboard(accessToken, range)) : Promise.resolve(null),
    canSeeAudit ? fetchOrAccessDenied(() => listAdminAuditLog(accessToken, { size: 8 })) : Promise.resolve(null),
  ]);
  const dashboard = dashboardResult && "data" in dashboardResult ? dashboardResult.data : null;
  const auditEvents = auditResult && "data" in auditResult ? auditResult.data.items : [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-title font-bold text-foreground">Hola, {user.firstName}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">{roleLabel(user.role)}</span>
            <span>
              {new Intl.DateTimeFormat("es-PE", { timeZone: SITE_TIME_ZONE, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}
            </span>
          </p>
        </div>
        {dashboard && (
          <nav aria-label="Período" className="inline-flex rounded-full bg-field p-1">
            {DASHBOARD_RANGES.map((option) => (
              <Link
                key={option}
                href={option === 30 ? "/admin" : `/admin?range=${option}`}
                aria-current={option === range ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  option === range ? "bg-surface text-foreground shadow-card" : "text-muted hover:text-foreground"
                }`}
              >
                {RANGE_LABEL[option]}
              </Link>
            ))}
          </nav>
        )}
      </div>


      {dashboard && <DashboardBody dashboard={dashboard} canSeeStats={canSeeStats} />}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">{dashboard && <RecentContent dashboard={dashboard} />}</div>

        <div className="space-y-6">

          {canSeeAudit && (
            <div className="rounded-card bg-surface shadow-card p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ClockCounterClockwise className="h-4 w-4 text-muted" aria-hidden="true" />
                Actividad reciente del sistema
              </h2>
              {auditEvents.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Sin actividad registrada todavía.</p>
              ) : (
                <div className="mt-3">
                  <AuditTimeline events={auditEvents} />
                </div>
              )}
              <Link href="/admin/actividad" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
                Ver auditoría completa →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CARD = "flex flex-col rounded-card bg-surface p-5 shadow-card transition-shadow duration-150 hover:shadow-pop";

function CardHeader({ label, icon: CardIcon }: { label: string; icon: Icon }) {
  return (
    <div className="flex items-start justify-between">
      <p className="text-sm font-medium text-muted">{label}</p>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <CardIcon weight="fill" className="size-[18px]" aria-hidden="true" />
      </span>
    </div>
  );
}

/** Indicador con su variación real frente al período anterior (texto + ícono, nunca solo color) y su forma diaria. */
function KpiCard({ label, icon, kpi, values, rangeDays }: {
  label: string;
  icon: Icon;
  kpi: DashboardKpi;
  values: number[];
  rangeDays: number;
}) {
  const change = kpiChange(kpi);
  return (
    <div className={CARD}>
      <CardHeader label={label} icon={icon} />
      <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-foreground">{NUMBER.format(kpi.current)}</p>
      <p className="mt-1 text-xs text-muted">
        {change.kind === "percent" && (
          <span className={`mr-1 inline-flex items-center gap-0.5 font-semibold ${change.value >= 0 ? "text-success" : "text-danger-ink"}`}>
            {change.value >= 0 ? (
              <TrendUp weight="bold" className="size-3" aria-hidden="true" />
            ) : (
              <TrendDown weight="bold" className="size-3" aria-hidden="true" />
            )}
            {change.value >= 0 ? "+" : ""}
            {change.value} %
          </span>
        )}
        {change.kind === "percent" && `vs. los ${rangeDays} días anteriores`}
        {change.kind === "new" && `Sin datos en los ${rangeDays} días anteriores`}
        {change.kind === "none" && `Últimos ${rangeDays} días`}
      </p>
      <div className="mt-3">
        <Sparkline values={values} />
      </div>
    </div>
  );
}

/** Contenido publicado en este momento, sumando los tipos que la persona puede ver. */
function publishedNow(dashboard: DashboardSummary): number {
  return Object.values(dashboard.byTypeAndStatus).reduce((total, byStatus) => total + (byStatus?.PUBLISHED ?? 0), 0);
}

function DashboardBody({ dashboard, canSeeStats }: { dashboard: DashboardSummary; canSeeStats: boolean }) {
  const { series, rangeDays, ads } = dashboard;
  const impressionsChange = ads ? kpiChange({ current: ads.impressions, previous: ads.previousImpressions }) : null;
  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Visitas" icon={Eye} kpi={dashboard.views} values={series.map((d) => d.views)} rangeDays={rangeDays} />
        <KpiCard label="Me gusta" icon={Heart} kpi={dashboard.likes} values={series.map((d) => d.likes)} rangeDays={rangeDays} />
        <KpiCard label="Publicado" icon={Article} kpi={dashboard.published} values={series.map((d) => d.published)} rangeDays={rangeDays} />
        {ads ? (
          <div className={CARD}>
            <CardHeader label="Clics en anuncios" icon={Megaphone} />
            <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-foreground">{ctr(ads.clicks, ads.impressions)}</p>
            <p className="mt-1 text-xs text-muted">
              {NUMBER.format(ads.clicks)} clics en {NUMBER.format(ads.impressions)} impresiones
            </p>
            {impressionsChange?.kind === "percent" && (
              <p className="mt-2 text-xs text-muted">
                Impresiones {impressionsChange.value >= 0 ? "+" : ""}
                {impressionsChange.value} % vs. el período anterior
              </p>
            )}
          </div>
        ) : (
          <div className={CARD}>
            <CardHeader label="En el sitio" icon={Globe} />
            <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-foreground">
              {NUMBER.format(publishedNow(dashboard))}
            </p>
            <p className="mt-1 text-xs text-muted">Contenido publicado ahora</p>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-card bg-surface p-5 shadow-card lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Visitas por día</h2>
            {canSeeStats && (
              <Link href="/admin/estadisticas" className="text-xs font-medium text-accent hover:underline">
                Ver estadísticas →
              </Link>
            )}
          </div>
          {dashboard.views.current === 0 ? (
            <p className="mt-4 rounded-lg bg-background px-4 py-10 text-center text-sm text-muted">
              Todavía no hay visitas en este período. Se cuentan cada vez que alguien abre un contenido publicado.
            </p>
          ) : (
            <div className="mt-4">
              <DailyAreaChart data={series.map((d) => ({ day: d.day, value: d.views }))} label="Visitas" />
            </div>
          )}
        </section>

        <section className="rounded-card bg-surface p-5 shadow-card">
          <h2 className="text-sm font-semibold text-foreground">Lo más visto</h2>
          {dashboard.topViewed.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Aparecerá cuando tu contenido reciba visitas.</p>
          ) : (
            <ol className="mt-3 space-y-1">
              {dashboard.topViewed.map((row, index) => (
                <li key={`${row.type}-${row.id}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-background">
                  <span className="w-5 shrink-0 text-right text-xs font-semibold tabular-nums text-muted">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`${CONTENT_TYPE_INFO[row.type].adminPath}/${row.id}`}
                      className="block truncate text-sm font-medium text-foreground hover:text-accent"
                    >
                      {row.title}
                    </Link>
                    <p className="text-xs text-muted">{CONTENT_TYPE_INFO[row.type].label}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{NUMBER.format(row.views)}</span>
                  <a
                    href={`${CONTENT_TYPE_INFO[row.type].publicPath}/${row.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted hover:text-accent"
                    aria-label={`Ver «${row.title}» en el sitio`}
                  >
                    <ArrowSquareOut className="size-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}

function RecentContent({ dashboard }: { dashboard: DashboardSummary }) {
  return (
    <>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Article className="h-4 w-4 text-muted" aria-hidden="true" />
        Contenido reciente
      </h2>
      {dashboard.recent.length === 0 ? (
        <p className="mt-3 rounded-card bg-surface shadow-card px-4 py-6 text-center text-sm text-muted">
          Todavía no hay contenido creado.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-card bg-surface shadow-card">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="border-b border-border/60 text-xs text-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Título</th>
                <th className="px-4 py-2.5 font-medium">Tipo</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
                <th className="px-4 py-2.5 font-medium">Creado</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recent.map((item) => (
                <tr key={`${item.type}-${item.id}`} className="border-b border-border/60 last:border-0 hover:bg-accent-soft/40">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`${CONTENT_TYPE_INFO[item.type].adminPath}/${item.id}`}
                      className="font-medium text-foreground hover:text-accent hover:underline"
                    >
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{CONTENT_TYPE_INFO[item.type].label}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={publicationStatusTone(item.status)} dot>
                      {publicationStatusLabel(item.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{formatPublishedDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

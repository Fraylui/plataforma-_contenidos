import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { TrendDown, TrendUp } from "@phosphor-icons/react/dist/ssr";
import { DASHBOARD_RANGES, kpiChange } from "@/lib/admin/dashboard";
import type { DashboardKpi, DashboardRange } from "@/lib/api/admin-types";
import { Sparkline } from "@/components/admin/dashboard-charts";

const NUMBER = new Intl.NumberFormat("es-PE");
const RANGE_LABEL: Record<DashboardRange, string> = { 7: "7 días", 30: "30 días", 90: "90 días" };

/** Tarjeta de indicador del panel (inicio y reportes). */
export const KPI_CARD = "flex flex-col rounded-card bg-surface p-5 shadow-card transition-shadow duration-150 hover:shadow-pop";

export function KpiCardHeader({ label, icon: CardIcon }: { label: string; icon: Icon }) {
  return (
    <div className="flex items-start justify-between">
      <p className="text-sm font-medium text-muted">{label}</p>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <CardIcon weight="fill" className="size-[18px]" aria-hidden="true" />
      </span>
    </div>
  );
}

/**
 * Indicador con su variación real frente al período anterior (texto + ícono,
 * nunca solo color) y su forma diaria. `display` reemplaza la cifra cuando
 * no es un conteo (un porcentaje).
 */
export function KpiCard({ label, icon, kpi, values, rangeDays, display, hint }: {
  label: string;
  icon: Icon;
  kpi: DashboardKpi;
  values: number[];
  rangeDays: number;
  display?: string;
  hint?: string;
}) {
  const change = kpiChange(kpi);
  return (
    <div className={KPI_CARD}>
      <KpiCardHeader label={label} icon={icon} />
      <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-foreground">{display ?? NUMBER.format(kpi.current)}</p>
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
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-3">
        <Sparkline values={values} />
      </div>
    </div>
  );
}

/** Período del reporte (?range=7|30|90 en la URL, 30 por defecto): se comparte y el botón atrás vuelve. */
export function RangeNav({ range, hrefFor }: { range: DashboardRange; hrefFor: (range: DashboardRange) => string }) {
  return (
    <nav aria-label="Período" className="inline-flex rounded-full bg-field p-1">
      {DASHBOARD_RANGES.map((option) => (
        <Link
          key={option}
          href={hrefFor(option)}
          aria-current={option === range ? "page" : undefined}
          scroll={false}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            option === range ? "bg-surface text-foreground shadow-card" : "text-muted hover:text-foreground"
          }`}
        >
          {RANGE_LABEL[option]}
        </Link>
      ))}
    </nav>
  );
}

import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { TrendUp } from "@phosphor-icons/react/dist/ssr";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent,
  trend,
}: {
  label: string;
  value: number | string;
  icon: PhosphorIcon;
  hint?: string;
  accent?: boolean;
  /** Delta calculado de datos reales por quien llama — nunca un valor de relleno. Se omite si es 0. */
  trend?: { value: number; label: string };
}) {
  return (
    <div className="rounded-card bg-surface p-5 shadow-card transition-shadow duration-150 hover:shadow-pop">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
            accent ? "bg-accent-soft text-accent" : "bg-field text-muted"
          }`}
        >
          <Icon weight="fill" className="size-[18px]" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-2">
        <p className={`text-3xl font-bold tracking-tight tabular-nums ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
        {trend && trend.value > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
            <TrendUp weight="bold" className="size-3" aria-hidden="true" />
            +{trend.value} {trend.label}
          </span>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

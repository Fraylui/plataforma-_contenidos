import { TrendingUp, type LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent,
  trend,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  hint?: string;
  accent?: boolean;
  /** Delta calculado de datos reales por quien llama — nunca un valor de relleno. Se omite si es 0. */
  trend?: { value: number; label: string };
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface p-5 transition-colors hover:border-accent/40">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            accent ? "bg-accent-soft text-accent" : "bg-background text-muted"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-2">
        <p className={`text-3xl font-bold tracking-tight tabular-nums ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
        {trend && trend.value > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
            +{trend.value} {trend.label}
          </span>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

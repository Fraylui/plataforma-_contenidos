import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
        <Icon className={`h-4 w-4 ${accent ? "text-accent" : "text-muted"}`} aria-hidden="true" />
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

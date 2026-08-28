export type StatusTone = "neutral" | "warning" | "success" | "danger";

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-border text-foreground",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300",
  success: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export function StatusPill({ tone, label }: { tone: StatusTone; label: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {label}
    </span>
  );
}

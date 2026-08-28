import type { ReactNode } from "react";

export const formInputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent disabled:opacity-60";

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      {children}
    </label>
  );
}

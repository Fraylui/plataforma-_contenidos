import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export { CollapsibleCard } from "./collapsible-card";

export const cardClass = "rounded-card bg-surface p-5 shadow-card sm:p-6";

/** Superficie con título opcional: profundidad por sombra, sin líneas grises. */
export function Card({
  title,
  description,
  actions,
  className,
  children,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn(cardClass, "space-y-4", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

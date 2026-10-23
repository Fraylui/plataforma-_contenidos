"use client";

import { useState, type ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/** Tarjeta plegable, cerrada por defecto: para lo opcional (SEO, avanzado). */
export function CollapsibleCard({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-card bg-surface shadow-card">
      <h2>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-card px-5 py-4 text-left text-base font-semibold tracking-tight text-foreground outline-none transition-colors hover:bg-field/60 focus-visible:ring-[3px] focus-visible:ring-ring sm:px-6"
        >
          {title}
          <CaretDown aria-hidden="true" className={cn("size-4 text-muted transition-transform duration-200", open && "rotate-180")} />
        </button>
      </h2>
      {open && <div className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>}
    </section>
  );
}

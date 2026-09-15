"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

const CARD_CLASS = "rounded-xl border border-border/60 bg-surface p-5";
const SECTION_TITLE_CLASS = "text-sm font-semibold text-foreground";

/** Grupo con título — misma superficie que el resto del panel (border-border/60, sin shadow). */
export function SectionCard({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`${CARD_CLASS} space-y-4 ${className}`}>
      <h2 className={SECTION_TITLE_CLASS}>{title}</h2>
      {children}
    </div>
  );
}

/** Colapsable, cerrado por defecto — para lo avanzado/opcional (SEO) que no debería competir con el contenido principal. */
export function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={CARD_CLASS}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between"
      >
        <h2 className={SECTION_TITLE_CLASS}>{title}</h2>
        <ChevronDown className={`h-4 w-4 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && <div className="mt-4 space-y-4">{children}</div>}
    </div>
  );
}

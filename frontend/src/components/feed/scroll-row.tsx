"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * Fila horizontal deslizable como la de historias de Instagram: sin barra de
 * desplazamiento visible (nada de "línea" debajo) y, en escritorio, flechas
 * ‹ › a los costados que aparecen solo si hay más contenido hacia ese lado.
 * En celular se desliza con el dedo.
 */
export function ScrollRow({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    setCanPrev(row.scrollLeft > 4);
    setCanNext(row.scrollLeft + row.clientWidth < row.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  function scroll(direction: 1 | -1) {
    const row = rowRef.current;
    if (!row) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    row.scrollBy({ left: direction * row.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  }

  const arrow =
    "absolute top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-surface text-foreground shadow-md ring-1 ring-border transition-opacity hover:bg-canvas sm:flex";

  return (
    <div className={cn("relative", className)}>
      <div ref={rowRef} data-testid="scroll-row" onScroll={update} className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {children}
      </div>
      {canPrev && (
        <button type="button" aria-label={`Ver ${label.toLowerCase()} anteriores`} onClick={() => scroll(-1)} className={cn(arrow, "left-0")}>
          <CaretLeft className="h-4 w-4" weight="bold" aria-hidden="true" />
        </button>
      )}
      {canNext && (
        <button type="button" aria-label={`Ver más ${label.toLowerCase()}`} onClick={() => scroll(1)} className={cn(arrow, "right-0")}>
          <CaretRight className="h-4 w-4" weight="bold" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

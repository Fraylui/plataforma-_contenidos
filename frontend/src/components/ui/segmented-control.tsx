"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T> {
  value: T;
  label: string;
}

/**
 * Control segmentado con radios nativos: flechas del teclado y lector de
 * pantalla sin código extra. Para elegir una de 2–4 opciones a la vista
 * (sin desplegable).
 */
export function SegmentedControl<T extends string | null>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  /** Nombre accesible del grupo. */
  label: string;
  options: SegmentedOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  className?: string;
}) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex w-full rounded-full bg-canvas-strong p-1 sm:w-auto", className)}>
      {options.map((option) => {
        const checked = value === option.value;
        return (
          // relative: el radio sr-only (absolute) queda dentro de su etiqueta; sin eso se ubica fuera del área con scroll
          // del panel y al elegir una opción el navegador desplaza toda la página para mostrarlo.
          <label
            key={option.label}
            className={cn(
              "relative flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring sm:flex-none",
              checked ? "bg-surface text-foreground shadow-card" : "text-muted hover:text-foreground",
            )}
          >
            <input
              type="radio"
              name={name}
              aria-label={option.label}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span aria-hidden="true">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

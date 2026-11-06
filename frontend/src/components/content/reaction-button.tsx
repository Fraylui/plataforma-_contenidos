"use client";

import { useEffect, useId, useRef, useState } from "react";
import { REACTIONS } from "@/components/content/reaction-bar";
import type { ReactionKey } from "@/components/content/use-reaction";
import { cn } from "@/lib/utils";

/** Los cuatro íconos chicos encimados: dice «aquí se reacciona» sin texto. */
function ReactionStack({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <span className="flex -space-x-1.5" aria-hidden="true">
      {REACTIONS.map((r) => {
        const Icon = r.icon;
        return (
          <span
            key={r.key}
            className={cn(
              "flex items-center justify-center rounded-full bg-linear-to-br text-white ring-2 ring-surface",
              size === "sm" ? "size-5" : "size-6",
              r.color,
            )}
          >
            <Icon weight="fill" className={size === "sm" ? "size-3" : "size-3.5"} />
          </span>
        );
      })}
    </span>
  );
}

/**
 * Reaccionar desde el feed o el detalle, como en Facebook: el botón muestra
 * las cuatro reacciones encimadas (o la que elegiste, con su nombre); al
 * tocarlo se abre una bandeja con las cuatro grandes. Elegir otra la cambia;
 * tocar la tuya la quita. Cierra con Escape, al tocar fuera o al elegir.
 *
 * `variant="floating"`: botón redondo del detalle (columna a la derecha) y
 * la bandeja se abre hacia la izquierda.
 */
export function ReactionButton({
  mine,
  onReact,
  variant = "bar",
}: {
  mine: ReactionKey | null;
  onReact: (next: ReactionKey | null) => void;
  variant?: "bar" | "floating";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const trayId = useId();
  const current = mine ? REACTIONS.find((r) => r.key === mine)! : null;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    // Foco en la reacción propia (o la primera) para elegir con teclado.
    const first = rootRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]') ??
      rootRef.current?.querySelector<HTMLButtonElement>(`[data-reaction]`);
    first?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(key: ReactionKey) {
    setOpen(false);
    triggerRef.current?.focus();
    if (mine !== key && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(12);
    onReact(mine === key ? null : key);
  }

  /** Flechas para moverse dentro de la bandeja. */
  function onTrayKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-reaction]"));
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const step = event.key === "ArrowRight" ? 1 : -1;
    buttons[(index + step + buttons.length) % buttons.length]?.focus();
    event.preventDefault();
  }

  const floating = variant === "floating";
  const CurrentIcon = current?.icon;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={trayId}
        aria-haspopup="true"
        // El nombre empieza con el texto visible (WCAG 2.5.3) y dice qué hace.
        aria-label={current ? `${current.label}: tu reacción. Cambiar o quitar` : "Reaccionar"}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
          floating
            ? "flex size-12 items-center justify-center rounded-full bg-surface/90 shadow-card backdrop-blur-md transition-[scale,background-color] duration-150 hover:bg-surface active:scale-95"
            : "inline-flex h-11 items-center gap-2 rounded-full px-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-canvas active:scale-95",
        )}
      >
        {current && CurrentIcon ? (
          <>
            <span
              key={current.key}
              className={cn(
                "flex items-center justify-center rounded-full bg-linear-to-br text-white shadow-sm motion-safe:animate-[reaction-pop_450ms_ease-out]",
                floating ? "size-9" : "size-7",
                current.color,
              )}
              aria-hidden="true"
            >
              <CurrentIcon weight="fill" className={floating ? "size-5" : "size-4"} />
            </span>
            {!floating && <span>{current.label}</span>}
          </>
        ) : (
          <>
            {floating ? (
              <span className="grid grid-cols-2 gap-0.5" aria-hidden="true">
                {REACTIONS.map((r) => {
                  const Icon = r.icon;
                  return (
                    <span key={r.key} className={cn("flex size-4 items-center justify-center rounded-full bg-linear-to-br text-white", r.color)}>
                      <Icon weight="fill" className="size-2.5" />
                    </span>
                  );
                })}
              </span>
            ) : (
              <ReactionStack />
            )}
            {!floating && <span>Reaccionar</span>}
          </>
        )}
      </button>

      {open && (
        <div
          id={trayId}
          role="group"
          aria-label="Elige una reacción"
          onKeyDown={onTrayKeyDown}
          className={cn(
            "absolute z-40 flex gap-1 rounded-full bg-surface p-1.5 shadow-[0_8px_30px_rgb(0_0_0/0.18)] ring-1 ring-border",
            "motion-safe:animate-[tray-in_180ms_cubic-bezier(0.2,0.9,0.3,1.2)]",
            floating ? "top-1/2 right-full mr-2 -translate-y-1/2 origin-right" : "bottom-full left-0 mb-2 origin-bottom-left",
          )}
        >
          {REACTIONS.map((r, i) => {
            const Icon = r.icon;
            const active = mine === r.key;
            return (
              <button
                key={r.key}
                type="button"
                data-reaction={r.key}
                aria-pressed={active}
                onClick={() => choose(r.key)}
                style={{ animationDelay: `${i * 35}ms` }}
                className={cn(
                  "group relative flex cursor-pointer flex-col items-center rounded-full p-1 outline-none",
                  "motion-safe:animate-[tray-item-in_260ms_ease-out_both] focus-visible:ring-[3px] focus-visible:ring-ring",
                )}
              >
                {/* Nombre encima al pasar o enfocar (en celular se ve la bandeja y se elige). */}
                <span
                  className={cn(
                    "pointer-events-none absolute -top-8 rounded-full bg-foreground px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-surface opacity-0 transition-opacity",
                    "group-hover:opacity-100 group-focus-visible:opacity-100",
                  )}
                  aria-hidden="true"
                >
                  {r.label}
                </span>
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full bg-linear-to-br text-white shadow-md",
                    "transition-transform duration-150 motion-safe:group-hover:-translate-y-1.5 motion-safe:group-hover:scale-125 group-active:scale-90",
                    r.color,
                    active && "ring-[3px] ring-foreground/70 ring-offset-2 ring-offset-surface",
                  )}
                >
                  <Icon weight="fill" aria-hidden="true" className="size-6" />
                </span>
                <span className="sr-only">{r.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

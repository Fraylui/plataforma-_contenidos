"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CONFETTI, FLOATERS, REACTIONS, topReactions } from "@/components/content/reaction-bar";
import type { ReactionCounts, ReactionKey } from "@/components/content/use-reaction";
import { cn } from "@/lib/utils";

const NUMBER = new Intl.NumberFormat("es-PE", { notation: "compact", maximumFractionDigits: 1 });

/**
 * Qué íconos van en la píldora: la reacción propia primero, luego las más
 * usadas (hasta tres). Sin reacciones todavía, las cuatro: invitan a tocar.
 */
export function pillReactions(counts: ReactionCounts, mine: ReactionKey | null): ReactionKey[] {
  const top = topReactions(counts).filter((k) => k !== mine);
  const keys = mine ? [mine, ...top].slice(0, 3) : top;
  return keys.length > 0 ? keys : REACTIONS.map((r) => r.key);
}

/** «Me encanta» → «Encanta»: cabe bajo el ícono en la bandeja. */
export function shortName(label: string): string {
  const word = label.replace(/^Me /, "");
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** «Reaccionar», «Me divierte: tu reacción»… más el total; empieza con lo que se ve (WCAG 2.5.3). */
export function triggerLabel(mine: ReactionKey | null, total: number): string {
  const totalText = total > 0 ? `${total}, ` : "";
  if (!mine) return `${totalText}Reaccionar`;
  const label = REACTIONS.find((r) => r.key === mine)!.label;
  return `${totalText}${label}: tu reacción. Cambiar o quitar`;
}

/**
 * Reaccionar en una sola píldora, sin texto (2026-11-05, tras ver que la
 * versión con «Reaccionar» y la fila «N reacciones» ocupaba dos líneas):
 * íconos encimados con vida (cada uno hace su gesto) y el total al lado. Si
 * ya reaccionaste, tu ícono va primero, más grande y con aro. Al tocar se
 * abre la bandeja con las cuatro grandes; al elegir, suben íconos flotando,
 * sale confeti y el celular vibra. Tocar la tuya la quita. Cierra con
 * Escape, al tocar fuera o al elegir. Sin animación si se pide menos
 * movimiento.
 *
 * `variant="floating"`: columna derecha del detalle; la bandeja se abre
 * hacia la izquierda y el total va debajo (lo pone FloatingReactions).
 */
export function ReactionButton({
  mine,
  counts,
  onReact,
  variant = "bar",
}: {
  mine: ReactionKey | null;
  counts: ReactionCounts;
  onReact: (next: ReactionKey | null) => void;
  variant?: "bar" | "floating";
}) {
  const [open, setOpen] = useState(false);
  // Cambia en cada reacción puesta: vuelve a montar confeti y flotantes.
  const [burst, setBurst] = useState<{ key: ReactionKey; n: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const trayId = useId();
  const floating = variant === "floating";
  const total = REACTIONS.reduce((sum, r) => sum + (counts[r.key] ?? 0), 0);
  const shown = pillReactions(counts, mine);

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
    const first =
      rootRef.current?.querySelector<HTMLButtonElement>('[data-reaction][aria-pressed="true"]') ??
      rootRef.current?.querySelector<HTMLButtonElement>("[data-reaction]");
    first?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(key: ReactionKey) {
    setOpen(false);
    triggerRef.current?.focus();
    const next = mine === key ? null : key;
    if (next) {
      setBurst((b) => ({ key: next, n: (b?.n ?? 0) + 1 }));
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(12);
    }
    onReact(next);
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

  const bursting = burst && mine === burst.key ? REACTIONS.find((r) => r.key === burst.key)! : null;
  const BurstIcon = bursting?.icon;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={trayId}
        aria-haspopup="true"
        aria-label={triggerLabel(mine, floating ? 0 : total)}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative flex cursor-pointer items-center outline-none focus-visible:ring-[3px] focus-visible:ring-ring active:scale-95",
          "transition-[scale,background-color] duration-150",
          floating
            ? "size-12 justify-center rounded-full bg-surface/90 shadow-card backdrop-blur-md hover:bg-surface"
            : "h-11 gap-1.5 rounded-full px-2 hover:bg-canvas",
        )}
      >
        <span className={cn("flex items-center", floating ? "-space-x-2.5" : "-space-x-1.5")} aria-hidden="true">
          {(floating && mine ? [mine] : floating ? shown.slice(0, 2) : shown).map((key, i) => {
            const r = REACTIONS.find((x) => x.key === key)!;
            const Icon = r.icon;
            const isMine = key === mine;
            return (
              <span
                key={isMine && burst ? `${key}-${burst.n}` : key}
                style={{ zIndex: 10 - i }}
                className={cn(
                  "relative flex items-center justify-center rounded-full bg-linear-to-br text-white ring-2 ring-surface",
                  r.color,
                  floating ? (isMine ? "size-9" : "size-7") : isMine ? "size-7" : "size-6",
                  isMine ? "motion-safe:animate-[reaction-pop_450ms_ease-out] shadow-md" : r.idle,
                )}
              >
                <Icon weight="fill" className={floating && isMine ? "size-5" : isMine ? "size-4" : "size-3.5"} />
              </span>
            );
          })}
        </span>
        {!floating && total > 0 && (
          <span
            key={total}
            aria-hidden="true"
            className={cn(
              "text-sm font-bold tabular-nums motion-safe:animate-[count-bump_300ms_ease-out]",
              mine ? "text-foreground" : "text-muted",
            )}
          >
            {NUMBER.format(total)}
          </span>
        )}

        {bursting && BurstIcon && (
          <span className="pointer-events-none absolute top-1/2 left-5" aria-hidden="true">
            {CONFETTI.map((p, i) => (
              <span
                key={`c-${burst?.n}-${i}`}
                style={{ "--dx": `${p.dx}px`, "--dy": `${p.dy}px` } as React.CSSProperties}
                className={cn(
                  "absolute top-0 left-0 size-1.5 rounded-sm opacity-0",
                  p.color,
                  "motion-safe:animate-[reaction-burst_600ms_ease-out_forwards]",
                )}
              />
            ))}
            {FLOATERS.map((f, i) => (
              <span
                key={`f-${burst?.n}-${i}`}
                style={{ "--sx": `${f.sx}px`, "--rot": `${f.rot}deg`, animationDelay: `${f.delay}ms` } as React.CSSProperties}
                className={cn(
                  "absolute bottom-0 left-0 z-10 flex size-6 items-center justify-center rounded-full bg-linear-to-br text-white opacity-0 shadow",
                  bursting.color,
                  "motion-safe:animate-[float-up_1100ms_ease-out_forwards]",
                )}
              >
                <BurstIcon weight="fill" className="size-3.5" />
              </span>
            ))}
          </span>
        )}
      </button>

      {open && (
        <div
          id={trayId}
          role="group"
          aria-label="Elige una reacción"
          onKeyDown={onTrayKeyDown}
          className={cn(
            "absolute z-40 flex gap-0.5 rounded-3xl bg-surface px-1.5 pt-2 pb-1.5 shadow-[0_8px_30px_rgb(0_0_0/0.18)] ring-1 ring-border",
            "motion-safe:animate-[tray-in_180ms_cubic-bezier(0.2,0.9,0.3,1.2)]",
            floating ? "top-1/2 right-full mr-2 origin-right -translate-y-1/2" : "bottom-full left-0 mb-1 origin-bottom-left",
          )}
        >
          {REACTIONS.map((r, i) => {
            const Icon = r.icon;
            const active = mine === r.key;
            const count = counts[r.key] ?? 0;
            return (
              <button
                key={r.key}
                type="button"
                data-reaction={r.key}
                aria-pressed={active}
                aria-label={count > 0 ? `${r.label}, ${count}` : r.label}
                onClick={() => choose(r.key)}
                style={{ animationDelay: `${i * 35}ms` }}
                className={cn(
                  "group flex w-[4.25rem] cursor-pointer flex-col items-center gap-1 rounded-2xl px-0.5 py-1 outline-none",
                  "transition-colors hover:bg-canvas focus-visible:ring-[3px] focus-visible:ring-ring",
                  "motion-safe:animate-[tray-item-in_260ms_ease-out_both]",
                  active && "bg-canvas",
                )}
              >
                <span className="relative">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full bg-linear-to-br text-white shadow-md",
                      "transition-transform duration-150 motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:scale-110 group-active:scale-90",
                      r.color,
                      r.idle,
                    )}
                  >
                    <Icon weight="fill" className="size-6" />
                  </span>
                  {/* Cuántas personas: globito arriba a la derecha, no debajo (antes quedaba cortado). */}
                  {count > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1.5 -right-2 min-w-5 rounded-full bg-foreground px-1 text-center text-[11px] leading-5 font-bold text-surface tabular-nums ring-2 ring-surface"
                    >
                      {NUMBER.format(count)}
                    </span>
                  )}
                </span>
                {/* El nombre siempre a la vista: un ícono solo no dice qué significa. */}
                <span aria-hidden="true" className={cn("text-[11px] leading-tight font-semibold", active ? "text-foreground" : "text-muted")}>
                  {shortName(r.label)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

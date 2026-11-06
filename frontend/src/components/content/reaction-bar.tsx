"use client";

import { useState } from "react";
import { HandsClapping, Heart, Lightning, Smiley, type Icon } from "@phosphor-icons/react";
import type { FeedItemType } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { applyReaction, nextReaction, useReaction, type ReactionKey } from "./use-reaction";

export type { ReactionKey };
export { applyReaction, nextReaction };

/**
 * Íconos propios a color (no emoji del sistema: se ven distintos en cada
 * celular). Cada uno tiene su gesto (`idle`): el corazón late, la carita se
 * ríe, el rayo parpadea y las manos aplauden, a destiempo entre sí.
 */
export const REACTIONS: {
  key: ReactionKey;
  icon: Icon;
  label: string;
  color: string;
  active: string;
  idle: string;
}[] = [
  {
    key: "LOVE",
    icon: Heart,
    label: "Me encanta",
    color: "from-rose-400 to-pink-600",
    active: "border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    idle: "motion-safe:animate-[idle-heartbeat_3.2s_ease-in-out_infinite]",
  },
  {
    key: "FUNNY",
    icon: Smiley,
    label: "Me divierte",
    color: "from-amber-300 to-orange-500",
    active: "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    idle: "motion-safe:animate-[idle-giggle_3.8s_ease-in-out_0.8s_infinite]",
  },
  {
    key: "WOW",
    icon: Lightning,
    label: "Me sorprende",
    color: "from-violet-400 to-indigo-600",
    active: "border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    idle: "motion-safe:animate-[idle-flicker_4.2s_ease-in-out_1.6s_infinite]",
  },
  {
    key: "INSPIRED",
    icon: HandsClapping,
    label: "Me inspira",
    color: "from-sky-400 to-cyan-600",
    active: "border-sky-300 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    idle: "motion-safe:animate-[idle-clap_3.5s_ease-in-out_2.4s_infinite]",
  },
];

const CONFETTI_COLORS = ["bg-rose-500", "bg-amber-400", "bg-violet-500", "bg-sky-500", "bg-emerald-400"];

/** Partículas del confeti: dirección (px) y color, fijas para que el render sea estable. */
const CONFETTI = [
  [0, -34], [24, -24], [34, 0], [24, 24], [0, 34], [-24, 24], [-34, 0], [-24, -24], [14, -36], [-14, -36],
].map(([dx, dy], i) => ({ dx, dy, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }));

/** Íconos que suben flotando al reaccionar: desvío lateral, giro y retraso. */
const FLOATERS = [
  { sx: -18, rot: -14, delay: 0 },
  { sx: 14, rot: 10, delay: 90 },
  { sx: -6, rot: -6, delay: 180 },
  { sx: 22, rot: 16, delay: 260 },
  { sx: -24, rot: -18, delay: 340 },
];

/** Las reacciones con votos, de la más a la menos usada (para el resumen de arriba). */
export function topReactions(counts: Record<ReactionKey, number>, max = 3): ReactionKey[] {
  return REACTIONS.filter((r) => (counts[r.key] ?? 0) > 0)
    .sort((a, b) => counts[b.key] - counts[a.key])
    .slice(0, max)
    .map((r) => r.key);
}

/** «Sé la primera persona en reaccionar», «1 persona reaccionó», «45 personas reaccionaron». */
export function reactionSummary(total: number, mine: boolean): string {
  if (total === 0) return "Sé la primera persona en reaccionar";
  if (mine && total === 1) return "Reaccionaste";
  if (mine) return `Tú y ${total - 1} ${total - 1 === 1 ? "persona más" : "personas más"}`;
  return `${total} ${total === 1 ? "persona reaccionó" : "personas reaccionaron"}`;
}

/**
 * «¿Qué te pareció?»: reacciones con vida (❤️ es el «me gusta», V83). Arriba, el
 * resumen social (íconos más usados encimados y cuántas personas). Cada
 * ícono hace su gesto de vez en cuando; al tocar, suben íconos flotando
 * como en un en vivo, sale confeti y el celular vibra un instante. Una
 * reacción por persona, se cambia o se quita. Anónimas (mismo id del
 * navegador que los «me gusta»). Sin animaciones si el celular pide menos
 * movimiento.
 */
export function ReactionBar({ type, id }: { type: FeedItemType; id: string }) {
  const live = useReaction({ type, id, fetchOnMount: true });
  // Cambia en cada toque que pone una reacción: vuelve a montar los efectos.
  const [burst, setBurst] = useState<{ key: ReactionKey; n: number } | null>(null);

  function react(tapped: ReactionKey) {
    const next = nextReaction(live.mine, tapped);
    if (next) {
      setBurst((b) => ({ key: next, n: (b?.n ?? 0) + 1 }));
      // Un toque corto en el celular (donde se puede); en la computadora no hace nada.
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(12);
    }
    void live.react(next);
  }

  const state = live.loaded ? live : null;
  // Hasta saber los conteos (o si el contenido no admite reacciones) no se dibuja nada.
  if (!state) return null;

  const total = REACTIONS.reduce((sum, r) => sum + (state.counts[r.key] ?? 0), 0);
  const top = topReactions(state.counts);

  return (
    <section id="reacciones" aria-label="¿Qué te pareció?" className="not-prose mt-8 scroll-mt-20 rounded-card bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base font-bold text-foreground">¿Qué te pareció?</p>
        <p className="flex items-center gap-2 text-xs text-muted" aria-live="polite">
          {top.length > 0 && (
            <span className="flex -space-x-1.5" aria-hidden="true">
              {top.map((key) => {
                const r = REACTIONS.find((x) => x.key === key)!;
                const TopIcon = r.icon;
                return (
                  <span
                    key={key}
                    className={cn("flex size-5 items-center justify-center rounded-full bg-linear-to-br text-white ring-2 ring-surface", r.color)}
                  >
                    <TopIcon weight="fill" className="size-3" />
                  </span>
                );
              })}
            </span>
          )}
          {reactionSummary(total, state.mine !== null)}
        </p>
      </div>

      <div role="group" aria-label="Elige una reacción" className="mt-3 grid grid-cols-4 gap-2">
        {REACTIONS.map((reaction) => {
          const count = state.counts[reaction.key] ?? 0;
          const active = state.mine === reaction.key;
          const ReactionIcon = reaction.icon;
          const bursting = active && burst?.key === reaction.key;
          return (
            <button
              key={reaction.key}
              type="button"
              aria-pressed={active}
              onClick={() => react(reaction.key)}
              className={cn(
                "group relative flex cursor-pointer flex-col items-center gap-1 rounded-2xl border px-1 pt-2.5 pb-2 text-xs font-medium",
                "transition-[scale,background-color,border-color,box-shadow] duration-150 active:scale-90",
                "outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-default",
                active ? cn(reaction.active, "shadow-card") : "border-transparent text-muted hover:bg-canvas-strong",
              )}
            >
              <span className="relative flex size-11 items-center justify-center">
                <span
                  key={bursting ? `pop-${burst?.n}` : "idle"}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full bg-linear-to-br text-white shadow-md",
                    "transition-transform duration-200 motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:scale-110",
                    reaction.color,
                    !active && state.mine !== null && "opacity-75 saturate-[0.8]",
                    bursting ? "motion-safe:animate-[reaction-pop_450ms_ease-out]" : reaction.idle,
                  )}
                >
                  <ReactionIcon weight="fill" aria-hidden="true" className="size-6" />
                </span>

                {bursting && (
                  <>
                    {/* Confeti de colores desde el centro. */}
                    {CONFETTI.map((p, i) => (
                      <span
                        key={`c-${burst?.n}-${i}`}
                        aria-hidden="true"
                        style={{ "--dx": `${p.dx}px`, "--dy": `${p.dy}px` } as React.CSSProperties}
                        className={cn(
                          "pointer-events-none absolute top-1/2 left-1/2 size-1.5 rounded-sm opacity-0",
                          p.color,
                          "motion-safe:animate-[reaction-burst_600ms_ease-out_forwards]",
                        )}
                      />
                    ))}
                    {/* El mismo ícono subiendo varias veces, como en un en vivo. */}
                    {FLOATERS.map((f, i) => (
                      <span
                        key={`f-${burst?.n}-${i}`}
                        aria-hidden="true"
                        style={
                          { "--sx": `${f.sx}px`, "--rot": `${f.rot}deg`, animationDelay: `${f.delay}ms` } as React.CSSProperties
                        }
                        className={cn(
                          "pointer-events-none absolute bottom-1/2 left-1/2 z-10 flex size-6 items-center justify-center rounded-full bg-linear-to-br text-white opacity-0 shadow",
                          reaction.color,
                          "motion-safe:animate-[float-up_1100ms_ease-out_forwards]",
                        )}
                      >
                        <ReactionIcon weight="fill" className="size-3.5" />
                      </span>
                    ))}
                  </>
                )}
              </span>
              {/* Una palabra a la vista (cabe en celular); el nombre completo para lectores de pantalla. */}
              <span className="leading-tight">
                <span className="sr-only">Me</span>{" "}
                <span className="inline-block first-letter:uppercase">{reaction.label.replace(/^Me /, "")}</span>
              </span>{" "}
              <span
                key={`${reaction.key}-${count}`}
                className={cn(
                  "min-h-4 font-bold tabular-nums motion-safe:animate-[count-bump_300ms_ease-out]",
                  count === 0 && "invisible",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

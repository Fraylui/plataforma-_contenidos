"use client";

import { useEffect, useState } from "react";
import { HandsClapping, Heart, Lightning, Smiley, type Icon } from "@phosphor-icons/react";
import type { FeedItemType } from "@/lib/api/types";
import { getOrCreateVisitorId } from "@/lib/visitor-id";
import { cn } from "@/lib/utils";

export type ReactionKey = "LOVE" | "FUNNY" | "WOW" | "INSPIRED";

/**
 * Íconos propios a color (no emoji del sistema: se ven distintos en cada
 * celular). `color`: degradado del círculo; `ring`: borde y texto al elegirla.
 */
export const REACTIONS: { key: ReactionKey; icon: Icon; label: string; color: string; active: string }[] = [
  { key: "LOVE", icon: Heart, label: "Me encanta", color: "from-rose-400 to-pink-600", active: "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
  { key: "FUNNY", icon: Smiley, label: "Me divierte", color: "from-amber-300 to-orange-500", active: "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
  { key: "WOW", icon: Lightning, label: "Me sorprende", color: "from-violet-400 to-indigo-600", active: "border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" },
  { key: "INSPIRED", icon: HandsClapping, label: "Me inspira", color: "from-sky-400 to-cyan-600", active: "border-sky-400 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" },
];

/** Direcciones de las partículas al reaccionar (px desde el centro). */
const BURST = [
  [0, -30], [26, -16], [26, 16], [0, 30], [-26, 16], [-26, -16],
] as const;

interface ReactionsState {
  counts: Record<ReactionKey, number>;
  mine: ReactionKey | null;
}

/** Toque en la reacción propia = quitarla; en otra = cambiarla. */
export function nextReaction(mine: ReactionKey | null, tapped: ReactionKey): ReactionKey | null {
  return mine === tapped ? null : tapped;
}

/** Conteo optimista: se ve al instante y luego se corrige con lo que diga el servidor. */
export function applyReaction(state: ReactionsState, next: ReactionKey | null): ReactionsState {
  const counts = { ...state.counts };
  if (state.mine) counts[state.mine] = Math.max(0, counts[state.mine] - 1);
  if (next) counts[next] = (counts[next] ?? 0) + 1;
  return { counts, mine: next };
}

/**
 * «¿Qué te pareció?»: reacciones con íconos animados, además del «me gusta». Una por
 * persona, se cambia o se quita. Anónimas, con el mismo id del navegador
 * que los «me gusta» (sin cuentas ni datos personales).
 */
export function ReactionBar({ type, id }: { type: FeedItemType; id: string }) {
  const [state, setState] = useState<ReactionsState | null>(null);
  const [pending, setPending] = useState(false);
  // Cambia en cada toque que pone una reacción: vuelve a montar la animación.
  const [burst, setBurst] = useState<{ key: ReactionKey; n: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const visitorId = getOrCreateVisitorId();
    fetch(`/api/reactions?type=${type}&id=${encodeURIComponent(id)}&visitorId=${visitorId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ReactionsState | null) => {
        if (!cancelled && data?.counts) setState(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [type, id]);

  async function react(tapped: ReactionKey) {
    if (!state || pending) return;
    const next = nextReaction(state.mine, tapped);
    const previous = state;
    setState(applyReaction(state, next));
    if (next) setBurst((b) => ({ key: next, n: (b?.n ?? 0) + 1 }));
    setPending(true);
    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, visitorId: getOrCreateVisitorId(), reaction: next }),
      });
      if (!res.ok) throw new Error();
      setState(await res.json());
    } catch {
      setState(previous);
    } finally {
      setPending(false);
    }
  }

  // Hasta saber los conteos (o si el contenido no admite reacciones) no se dibuja nada.
  if (!state) return null;

  return (
    <section aria-label="¿Qué te pareció?" className="not-prose mt-8">
      <p className="mb-2 text-sm font-semibold text-foreground">¿Qué te pareció?</p>
      <div role="group" aria-label="Reacciones" className="flex flex-wrap gap-2">
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
              disabled={pending}
              onClick={() => void react(reaction.key)}
              className={cn(
                "group inline-flex cursor-pointer items-center gap-2 rounded-full border py-1 pr-3.5 pl-1 text-sm font-medium",
                "transition-[scale,background-color,border-color,box-shadow] duration-150 active:scale-95",
                "outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-default",
                active ? cn(reaction.active, "shadow-card") : "border-border bg-surface text-foreground hover:bg-canvas-strong",
              )}
            >
              <span className="relative flex size-8 items-center justify-center">
                <span
                  key={bursting ? `pop-${burst?.n}` : "idle"}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full bg-linear-to-br text-white shadow-sm",
                    "transition-transform duration-150 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:rotate-[-6deg]",
                    reaction.color,
                    !active && "opacity-90 saturate-[0.85]",
                    bursting && "motion-safe:animate-[reaction-pop_450ms_ease-out]",
                  )}
                >
                  <ReactionIcon weight="fill" aria-hidden="true" className="size-[18px]" />
                </span>
                {bursting &&
                  BURST.map(([dx, dy], i) => (
                    <span
                      key={`${burst?.n}-${i}`}
                      aria-hidden="true"
                      style={{ "--dx": `${dx}px`, "--dy": `${dy}px` } as React.CSSProperties}
                      className={cn(
                        "pointer-events-none absolute top-1/2 left-1/2 size-2 rounded-full bg-linear-to-br opacity-0",
                        reaction.color,
                        "motion-safe:animate-[reaction-burst_550ms_ease-out_forwards]",
                      )}
                    />
                  ))}
              </span>
              <span>{reaction.label}</span>
              {count > 0 && (
                <>
                  {" "}
                  <span
                    key={`${reaction.key}-${count}`}
                    className="font-semibold tabular-nums motion-safe:animate-[count-bump_300ms_ease-out]"
                  >
                    {count}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

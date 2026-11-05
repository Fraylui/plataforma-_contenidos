"use client";

import { useEffect, useState } from "react";
import type { FeedItemType } from "@/lib/api/types";
import { getOrCreateVisitorId } from "@/lib/visitor-id";
import { cn } from "@/lib/utils";

export type ReactionKey = "LOVE" | "FUNNY" | "WOW" | "INSPIRED";

export const REACTIONS: { key: ReactionKey; emoji: string; label: string }[] = [
  { key: "LOVE", emoji: "😍", label: "Me encanta" },
  { key: "FUNNY", emoji: "😂", label: "Me divierte" },
  { key: "WOW", emoji: "😮", label: "Me sorprende" },
  { key: "INSPIRED", emoji: "🙌", label: "Me inspira" },
];

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
 * «¿Qué te pareció?»: reacciones con emoji, además del «me gusta». Una por
 * persona, se cambia o se quita. Anónimas, con el mismo id del navegador
 * que los «me gusta» (sin cuentas ni datos personales).
 */
export function ReactionBar({ type, id }: { type: FeedItemType; id: string }) {
  const [state, setState] = useState<ReactionsState | null>(null);
  const [pending, setPending] = useState(false);

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
          return (
            <button
              key={reaction.key}
              type="button"
              aria-pressed={active}
              disabled={pending}
              onClick={() => void react(reaction.key)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-[scale,background-color,border-color] active:scale-95",
                "outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-default",
                active ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-foreground hover:bg-canvas-strong",
              )}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                {reaction.emoji}
              </span>
              <span>{reaction.label}</span>
              {count > 0 && (
                <>
                  {" "}
                  <span className="font-semibold tabular-nums">{count}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

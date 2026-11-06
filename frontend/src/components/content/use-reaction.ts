"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { FeedItemType } from "@/lib/api/types";
import { getOrCreateVisitorId } from "@/lib/visitor-id";

export type ReactionKey = "LOVE" | "FUNNY" | "WOW" | "INSPIRED";
export type ReactionCounts = Record<ReactionKey, number>;

export interface ReactionsState {
  counts: ReactionCounts;
  mine: ReactionKey | null;
}

const KEYS: ReactionKey[] = ["LOVE", "FUNNY", "WOW", "INSPIRED"];

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

export function fullCounts(partial?: Partial<Record<ReactionKey, number>>): ReactionCounts {
  return Object.fromEntries(KEYS.map((k) => [k, partial?.[k] ?? 0])) as ReactionCounts;
}

export function totalOf(counts: ReactionCounts): number {
  return KEYS.reduce((sum, k) => sum + counts[k], 0);
}

/*
 * Estado compartido por contenido: la tarjeta del feed, el botón flotante y
 * «¿Qué te pareció?» de un mismo post muestran siempre lo mismo. Los conteos
 * vienen del servidor (feed o GET); la reacción propia se recuerda en el
 * navegador (como el «me gusta», sin cuentas) para no pedirla por tarjeta.
 */
const CHANGE_EVENT = "reaction-change";
const counts = new Map<string, ReactionCounts>();

/** El «me gusta» de antes es «Me encanta»: su marca en el navegador sigue valiendo. */
const LIKE_TYPE: Record<FeedItemType, string> = {
  PUBLICATION: "publications",
  PLACE: "places",
  CELEBRATION: "celebrations",
  GALLERY: "galleries",
  EPISODE: "episodes",
};

function mineKey(type: FeedItemType, id: string) {
  return `reaction:${type}:${id}`;
}

function readMine(type: FeedItemType, id: string, likeKey?: string): ReactionKey | null {
  try {
    const stored = localStorage.getItem(mineKey(type, id));
    if (stored !== null) return (KEYS as string[]).includes(stored) ? (stored as ReactionKey) : null;
    if (likeKey && localStorage.getItem(`liked:${LIKE_TYPE[type]}:${likeKey}`) === "1") return "LOVE";
  } catch {
    // Sin localStorage (modo privado): nadie recuerda la reacción, no es un error.
  }
  return null;
}

function writeMine(type: FeedItemType, id: string, mine: ReactionKey | null) {
  try {
    localStorage.setItem(mineKey(type, id), mine ?? "");
  } catch {
    // Igual que readMine.
  }
}

function emit() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

function store(type: FeedItemType, id: string, state: ReactionsState) {
  counts.set(`${type}:${id}`, state.counts);
  writeMine(type, id, state.mine);
  emit();
}

const pending = new Set<string>();

/** Solo tests: el estado compartido vive en el módulo y no debe pasar de un test a otro. */
export function resetReactionStoreForTests() {
  counts.clear();
  pending.clear();
}

export function useReaction({
  type,
  id,
  likeKey,
  initialCounts,
  fetchOnMount = false,
}: {
  type: FeedItemType;
  id: string;
  /** Slug (o id en episodios) del «me gusta» de antes, para reconocerlo como «Me encanta». */
  likeKey?: string;
  initialCounts?: Partial<Record<ReactionKey, number>>;
  /** En la página del post: trae del servidor los conteos al día y la reacción propia. */
  fetchOnMount?: boolean;
}) {
  const key = `${type}:${id}`;
  const shared = useSyncExternalStore(subscribe, () => counts.get(key) ?? null, () => null);
  const mine = useSyncExternalStore(subscribe, () => readMine(type, id, likeKey), () => null);
  const loaded = shared !== null || !fetchOnMount;

  useEffect(() => {
    if (!fetchOnMount) return;
    let cancelled = false;
    fetch(`/api/reactions?type=${type}&id=${encodeURIComponent(id)}&visitorId=${getOrCreateVisitorId()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ReactionsState | null) => {
        if (!cancelled && data?.counts) store(type, id, { counts: fullCounts(data.counts), mine: data.mine ?? null });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [type, id, fetchOnMount]);

  const state: ReactionsState = { counts: shared ?? fullCounts(initialCounts), mine };

  async function react(next: ReactionKey | null) {
    if (pending.has(key)) return;
    const previous = state;
    pending.add(key);
    store(type, id, applyReaction(previous, next));
    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, visitorId: getOrCreateVisitorId(), reaction: next }),
      });
      if (!res.ok) throw new Error();
      const data: ReactionsState = await res.json();
      store(type, id, { counts: fullCounts(data.counts), mine: data.mine ?? null });
    } catch {
      store(type, id, previous);
    } finally {
      pending.delete(key);
    }
  }

  return { ...state, total: totalOf(state.counts), loaded, react };
}

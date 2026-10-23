"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ActiveTopic, StoryView } from "@/lib/api/types";

/** Cuánto se ve cada historia (spec 2026-10-23). */
export const STORY_DURATION_MS = 6_000;
const TICK_MS = 50;

export interface PlayerState {
  topicIndex: number;
  storyIndex: number;
  paused: boolean;
  finished: boolean;
}

export type PlayerAction =
  | { type: "next" }
  | { type: "prev" }
  | { type: "nextTopic" }
  | { type: "prevTopic" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "goTo"; topicIndex: number; storyIndex: number };

/**
 * Máquina de estados del visor, pura: recibe los temas para saber cuántas
 * historias tiene cada uno. «Siguiente» en la última de un tema pasa al
 * siguiente tema (como Instagram); en el último tema, termina.
 */
export function storyPlayerReducer(state: PlayerState, action: PlayerAction, topics: ActiveTopic[]): PlayerState {
  const lastTopic = topics.length - 1;
  const count = (topicIndex: number) => topics[topicIndex]?.stories.length ?? 0;
  switch (action.type) {
    case "next":
      if (state.storyIndex < count(state.topicIndex) - 1) return { ...state, storyIndex: state.storyIndex + 1 };
      if (state.topicIndex < lastTopic) return { ...state, topicIndex: state.topicIndex + 1, storyIndex: 0 };
      return { ...state, finished: true };
    case "prev":
      if (state.storyIndex > 0) return { ...state, storyIndex: state.storyIndex - 1, finished: false };
      if (state.topicIndex > 0) {
        return { ...state, topicIndex: state.topicIndex - 1, storyIndex: count(state.topicIndex - 1) - 1, finished: false };
      }
      return state;
    case "nextTopic":
      if (state.topicIndex < lastTopic) return { ...state, topicIndex: state.topicIndex + 1, storyIndex: 0 };
      return { ...state, finished: true };
    case "prevTopic":
      return state.topicIndex > 0 ? { ...state, topicIndex: state.topicIndex - 1, storyIndex: 0, finished: false } : state;
    case "pause":
      return { ...state, paused: true };
    case "resume":
      return { ...state, paused: false };
    case "goTo":
      return { ...state, topicIndex: action.topicIndex, storyIndex: action.storyIndex, finished: false };
  }
}

/** Sin las caducadas (salvo Destacadas) ni temas vacíos: la lista pública puede venir de una caché de segundos. */
export function playableTopics(topics: ActiveTopic[], now: Date): ActiveTopic[] {
  const time = now.getTime();
  return topics
    .map((topic) => ({
      ...topic,
      stories: topic.stories.filter((story) => story.highlighted || Date.parse(story.expiresAt) > time),
    }))
    .filter((topic) => topic.stories.length > 0);
}

/**
 * El reloj del visor: avanza solo con la foto lista, sin pausa y con la
 * pestaña visible. `progress` (0..1) alimenta la barra de la historia actual.
 */
export function useStoryPlayer(topics: ActiveTopic[], startTopicId: string, { durationMs = STORY_DURATION_MS } = {}) {
  const startIndex = Math.max(0, topics.findIndex((topic) => topic.category.id === startTopicId));
  const [state, dispatch] = useReducer(
    (current: PlayerState, action: PlayerAction) => storyPlayerReducer(current, action, topics),
    { topicIndex: startIndex, storyIndex: 0, paused: false, finished: false },
  );
  const [imageReady, setImageReady] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const current: StoryView | null = state.finished ? null : (topics[state.topicIndex]?.stories[state.storyIndex] ?? null);
  const running = current !== null && imageReady && !state.paused && !hidden;

  // Otra historia: el reloj vuelve a cero y espera su foto. Se ajusta durante el render (no en un efecto) para no pintar un cuadro con la barra llena.
  const storyKey = current?.id ?? null;
  const [lastKey, setLastKey] = useState(storyKey);
  if (lastKey !== storyKey) {
    setLastKey(storyKey);
    setElapsed(0);
    setImageReady(false);
  }
  // El tiempo transcurrido vive en la ref (fuente de verdad entre ticks): si React agrupa varios ticks sin
  // volver a pintar, un estado leído en el intervalo quedaría viejo y la barra no avanzaría.
  const elapsedRef = useRef(0);
  useEffect(() => {
    elapsedRef.current = 0;
  }, [storyKey]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      elapsedRef.current += TICK_MS;
      if (elapsedRef.current >= durationMs) {
        elapsedRef.current = 0;
        setElapsed(0);
        dispatch({ type: "next" });
      } else {
        setElapsed(elapsedRef.current);
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [running, durationMs]);

  const progress = useMemo(() => Math.min(1, elapsed / durationMs), [elapsed, durationMs]);
  return { state, current, progress, dispatch, setImageReady };
}

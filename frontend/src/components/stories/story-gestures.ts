"use client";

import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

/** Mantener presionado más que esto = pausa (no es un toque). */
export const HOLD_MS = 180;
/** Velocidad (px/ms) que basta para cerrar o cambiar de tema aunque el recorrido sea corto: un gesto rápido alcanza. */
export const VELOCITY = 0.11;
/** Recorrido hacia abajo que cierra aunque el gesto sea lento. */
export const DISMISS_Y = 120;
/** Fracción del ancho que cambia de tema aunque el gesto sea lento. */
export const TOPIC_RATIO = 0.3;
/** Hasta aquí un movimiento sigue siendo un toque (el dedo nunca queda quieto). */
const TAP_SLOP = 10;

export type Release = "tapLeft" | "tapRight" | "dismiss" | "nextTopic" | "prevTopic" | "swipeUp" | "none";

/** Qué fue un gesto al soltar: `x` es dónde empezó, relativo al visor de ancho `width`. */
export function classifyRelease({ dx, dy, dt, x, width }: { dx: number; dy: number; dt: number; x: number; width: number }): Release {
  if (Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP) return x < width / 3 ? "tapLeft" : "tapRight";
  const elapsed = Math.max(dt, 1);
  if (Math.abs(dx) > Math.abs(dy)) {
    const fast = Math.abs(dx) / elapsed > VELOCITY;
    if (!fast && Math.abs(dx) < width * TOPIC_RATIO) return "none";
    return dx < 0 ? "nextTopic" : "prevTopic";
  }
  const fast = Math.abs(dy) / elapsed > VELOCITY;
  if (dy > 0) return fast || dy > DISMISS_Y ? "dismiss" : "none";
  return fast || -dy > DISMISS_Y / 2 ? "swipeUp" : "none";
}

export interface GestureHandlers {
  onTapLeft: () => void;
  onTapRight: () => void;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  onNextTopic: () => void;
  onPrevTopic: () => void;
  onDismiss: () => void;
  onSwipeUp: () => void;
  /** Durante el arrastre: quien lo usa mueve la tarjeta con `transform` (no con estado de React). */
  onDrag: (dx: number, dy: number) => void;
  /** El arrastre no alcanzó para nada: la tarjeta vuelve a su lugar. */
  onDragCancel: () => void;
}

interface Press {
  pointerId: number;
  x: number;
  y: number;
  left: number;
  width: number;
  at: number;
  moved: boolean;
  holding: boolean;
}

/**
 * Toques, mantener, arrastrar y deslizar del visor con Pointer Events (dedo,
 * mouse y lápiz por igual). Un solo puntero a la vez: un segundo dedo a mitad
 * del gesto se ignora (si no, la tarjeta saltaría). Captura el puntero para
 * que el arrastre siga aunque salga de la tarjeta.
 */
export function useStoryGestures(handlers: GestureHandlers) {
  const press = useRef<Press | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });
  useEffect(() => () => clearTimeout(holdTimer.current), []);

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (press.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    press.current = {
      pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, width: rect.width,
      at: Date.now(), moved: false, holding: false,
    };
    holdTimer.current = setTimeout(() => {
      if (press.current && !press.current.moved) {
        press.current.holding = true;
        latest.current.onHoldStart();
      }
    }, HOLD_MS);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const current = press.current;
    if (!current || event.pointerId !== current.pointerId || current.holding) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.moved && Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP) return;
    current.moved = true;
    clearTimeout(holdTimer.current);
    latest.current.onDrag(dx, dy);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLElement>) {
    const current = press.current;
    if (!current || event.pointerId !== current.pointerId) return;
    press.current = null;
    clearTimeout(holdTimer.current);
    if (current.holding) {
      latest.current.onHoldEnd();
      return;
    }
    const release = classifyRelease({
      dx: event.clientX - current.x,
      dy: event.clientY - current.y,
      dt: Date.now() - current.at,
      x: current.x - current.left,
      width: current.width,
    });
    const h = latest.current;
    const actions: Record<Release, () => void> = {
      tapLeft: h.onTapLeft, tapRight: h.onTapRight, dismiss: h.onDismiss, nextTopic: h.onNextTopic,
      prevTopic: h.onPrevTopic, swipeUp: h.onSwipeUp, none: h.onDragCancel,
    };
    actions[release]();
  }

  function onPointerCancel(event: ReactPointerEvent<HTMLElement>) {
    const current = press.current;
    if (!current || event.pointerId !== current.pointerId) return;
    press.current = null;
    clearTimeout(holdTimer.current);
    if (current.holding) latest.current.onHoldEnd();
    else latest.current.onDragCancel();
  }

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}

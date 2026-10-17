"use client";

import { useEffect, useRef } from "react";

/** Decisión del dueño (2026-10-07): borrador en el servidor cada 10 s mientras se escribe. */
export const AUTOSAVE_INTERVAL_MS = 10_000;

/**
 * Guardado automático: cada {@link AUTOSAVE_INTERVAL_MS}, si hay cambios y
 * está habilitado (solo borradores: nunca toca lo publicado sin que se pida).
 * Nunca dos guardados a la vez; siempre llama a la versión más reciente de
 * `save`, que lee los valores actuales del formulario.
 */
export function useAutosave({ enabled, dirty, save }: { enabled: boolean; dirty: boolean; save: () => Promise<unknown> }) {
  const saveRef = useRef(save);
  const dirtyRef = useRef(dirty);
  const runningRef = useRef(false);

  useEffect(() => {
    saveRef.current = save;
    dirtyRef.current = dirty;
  });

  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(async () => {
      if (!dirtyRef.current || runningRef.current) return;
      runningRef.current = true;
      try {
        await saveRef.current();
      } finally {
        runningRef.current = false;
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [enabled]);
}

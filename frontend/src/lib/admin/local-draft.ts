"use client";

import { useEffect, useMemo, useState } from "react";
import { useMounted } from "@/lib/use-mounted";

/**
 * Guardado automático en el navegador mientras se crea o edita contenido:
 * si se cierra la pestaña, se corta la luz o se navega a otra parte del
 * panel sin guardar, al volver se ofrece recuperar lo escrito. Vive solo en
 * este navegador (localStorage): es una red de seguridad personal, no el
 * guardado real, que sigue siendo el botón Guardar.
 */
const PREFIX = "panel-borrador:";
const SAVE_DELAY_MS = 800;

interface StoredDraft<T> {
  savedAt: string;
  value: T;
}

export function readDraft<T>(storage: Pick<Storage, "getItem"> | null, key: string): StoredDraft<T> | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft<T>;
    return parsed && typeof parsed.savedAt === "string" && "value" in parsed ? parsed : null;
  } catch {
    return null;
  }
}

export function writeDraft<T>(storage: Pick<Storage, "setItem"> | null, key: string, value: T, now = new Date()): void {
  if (!storage) return;
  try {
    storage.setItem(PREFIX + key, JSON.stringify({ savedAt: now.toISOString(), value } satisfies StoredDraft<T>));
  } catch {
    // Almacenamiento lleno o bloqueado (modo privado): se sigue sin red de seguridad.
  }
}

export function removeDraft(storage: Pick<Storage, "removeItem"> | null, key: string): void {
  if (!storage) return;
  try {
    storage.removeItem(PREFIX + key);
  } catch {
    // Igual que arriba.
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * `current` es lo que hay en el formulario y `saved` lo último guardado en
 * el servidor. Devuelve si hay cambios sin guardar, un borrador anterior
 * para ofrecer recuperar, y cómo descartarlo o darlo por guardado.
 */
export function useLocalDraft<T>(key: string, current: T, saved: T) {
  const currentJson = JSON.stringify(current);
  const savedJson = JSON.stringify(saved);
  const dirty = currentJson !== savedJson;
  const mounted = useMounted();
  const [decided, setDecided] = useState(false);
  // El borrador que había AL ABRIR (no los que se van guardando mientras se escribe).
  // Se lee recién tras hidratar: en el servidor no hay localStorage.
  const initialDraft = useMemo(() => (mounted ? readDraft<T>(safeStorage(), key) : null), [mounted, key]);
  const recoverable = !decided && initialDraft && JSON.stringify(initialDraft.value) !== savedJson ? initialDraft : null;

  // Mientras se escribe: guardar con una pequeña demora. Sin cambios, no hay borrador.
  useEffect(() => {
    if (recoverable) return; // no pisar el borrador viejo antes de que se decida qué hacer con él
    const timer = window.setTimeout(() => {
      if (dirty) writeDraft(safeStorage(), key, JSON.parse(currentJson) as T);
      else removeDraft(safeStorage(), key);
    }, SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [key, currentJson, dirty, recoverable]);

  // Aviso del navegador al cerrar o recargar con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return {
    dirty,
    recoverable,
    /** Ya se aplicó o se descartó el borrador ofrecido. */
    dismissRecoverable() {
      setDecided(true);
    },
    discardRecoverable() {
      removeDraft(safeStorage(), key);
      setDecided(true);
    },
    /** Llamar tras guardar en el servidor. */
    clear() {
      removeDraft(safeStorage(), key);
    },
  };
}

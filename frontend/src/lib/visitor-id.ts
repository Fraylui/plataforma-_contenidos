"use client";

const STORAGE_KEY = "visitor-id";

/** UUID anónimo por navegador, usado solo para deduplicar "me gusta" (ver engagement.ContentLike en el backend). No identifica a la persona. */
export function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // localStorage bloqueado (modo privado, etc.): un id de sesión sirve para esta carga de página.
    return crypto.randomUUID();
  }
}

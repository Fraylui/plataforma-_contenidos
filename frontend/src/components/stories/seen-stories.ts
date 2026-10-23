/**
 * Qué historias ya vio este navegador, para el anillo gris de la fila del
 * Inicio. Solo en localStorage (no sale del dispositivo; ver la política de
 * privacidad): id → cuándo caduca, para podar solo. Si el almacenamiento está
 * bloqueado (modo privado, Safari lleno), todo se ve como «sin ver» y nada falla.
 */
export const SEEN_STORIES_KEY = "historias-vistas";
const MAX_ENTRIES = 500;

type SeenMap = Record<string, string>;

const listeners = new Set<() => void>();

function read(): SeenMap {
  try {
    const raw = localStorage.getItem(SEEN_STORIES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as SeenMap) : {};
  } catch {
    return {};
  }
}

function write(map: SeenMap) {
  try {
    localStorage.setItem(SEEN_STORIES_KEY, JSON.stringify(map));
  } catch {
    // Sin almacenamiento: el anillo simplemente no se pone gris.
  }
}

/** Sin las caducadas y con tope: se quedan las que caducan más tarde. */
function prune(map: SeenMap, now: number): SeenMap {
  const alive = Object.entries(map).filter(([, expiresAt]) => Date.parse(expiresAt) > now);
  alive.sort(([, a], [, b]) => Date.parse(b) - Date.parse(a));
  return Object.fromEntries(alive.slice(0, MAX_ENTRIES));
}

export function markSeen(id: string, expiresAt: string): void {
  const map = read();
  if (map[id] === expiresAt) return;
  write(prune({ ...map, [id]: expiresAt }, Date.now()));
  listeners.forEach((listener) => listener());
}

export function isSeen(id: string): boolean {
  return id in read();
}

/** Todas vistas; un tema sin historias no cuenta como visto. */
export function allSeen(ids: string[]): boolean {
  if (ids.length === 0) return false;
  const map = read();
  return ids.every((id) => id in map);
}

/** Para useSyncExternalStore: también se entera si otra pestaña marca historias. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === SEEN_STORIES_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

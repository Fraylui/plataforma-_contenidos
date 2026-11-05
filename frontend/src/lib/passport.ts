import { PERU_REGIONS } from "@/lib/peru-regions";

/**
 * Pasaporte «Mi Perú»: los lugares que la persona marcó como «Quiero ir» o
 * «Ya fui». Vive solo en su navegador (localStorage): no hay cuenta, no se
 * envía al servidor y no es un dato personal que guardemos (Ley 29733).
 */
export type PassportStatus = "WANT" | "BEEN";

export interface PassportEntry {
  name: string;
  href: string;
  region: string | null;
  status: PassportStatus;
  /** ISO de cuándo lo marcó. */
  at: string;
}

export type Passport = Record<string, PassportEntry>;

const STORAGE_KEY = "pasaporte:v1";
const CHANGE_EVENT = "pasaporte-cambio";
const EMPTY: Passport = {};

export function parsePassport(raw: string | null): Passport {
  if (!raw) return EMPTY;
  try {
    const data = JSON.parse(raw);
    return data && typeof data === "object" && !Array.isArray(data) ? (data as Passport) : EMPTY;
  } catch {
    return EMPTY;
  }
}

/** Toque en el estado que ya tiene = quitarlo; en el otro = cambiarlo. */
export function withStatus(
  passport: Passport,
  slug: string,
  place: Omit<PassportEntry, "status" | "at">,
  status: PassportStatus,
  now = new Date(),
): Passport {
  const next = { ...passport };
  if (passport[slug]?.status === status) {
    delete next[slug];
  } else {
    next[slug] = { ...place, status, at: now.toISOString() };
  }
  return next;
}

/** Regiones con sello (al menos un «Ya fui»), con el primer lugar y la fecha del sello. */
export function stamps(passport: Passport): Map<string, { place: string; at: string }> {
  const result = new Map<string, { place: string; at: string }>();
  const been = Object.values(passport)
    .filter((e) => e.status === "BEEN" && e.region)
    .sort((a, b) => a.at.localeCompare(b.at));
  for (const entry of been) {
    if (!result.has(entry.region!)) result.set(entry.region!, { place: entry.name, at: entry.at });
  }
  return result;
}

export const TOTAL_REGIONS = PERU_REGIONS.length;

/** «¡Primer sello!», «¡Vas por la mitad!», «¡Conoces todo el Perú!»… */
export function milestone(count: number): string | null {
  if (count === 1) return "¡Primer sello!";
  if (count === 5) return "¡Cinco regiones!";
  if (count === 13) return "¡Ya vas por la mitad del Perú!";
  if (count === TOTAL_REGIONS) return "¡Conoces todo el Perú!";
  return null;
}

let cachedRaw: string | null | undefined;
let cachedValue: Passport = EMPTY;

export function readPassport(): Passport {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parsePassport(raw);
  }
  return cachedValue;
}

export function serverPassport(): Passport {
  return EMPTY;
}

export function savePassport(passport: Passport): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(passport));
  } catch {
    // Navegación privada o almacenamiento lleno: el pasaporte no se guarda, pero la página sigue.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribePassport(listener: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

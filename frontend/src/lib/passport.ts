import { PERU_REGIONS } from "@/lib/peru-regions";

/**
 * «Mis viajes»: los lugares que la persona marcó como «Quiero ir» o «Ya
 * fui». Cada «Ya fui» da un sello: el de la región dentro del Perú y el del
 * país fuera de él. Vive solo en su navegador (localStorage): no hay cuenta, no se
 * envía al servidor y no es un dato personal que guardemos (Ley 29733).
 */
export type PassportStatus = "WANT" | "BEEN";

export interface PassportEntry {
  name: string;
  href: string;
  region: string | null;
  /** País ISO alfa-2; ausente en lo guardado antes de que existiera (se asume Perú si hay región). */
  country?: string | null;
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

export type Stamp = { place: string; at: string };

/** País del lugar; lo guardado antes de existir el país con región del Perú cuenta como Perú. */
export function entryCountry(entry: PassportEntry): string | null {
  return entry.country ?? (entry.region ? "PE" : null);
}

function firstBy(passport: Passport, key: (e: PassportEntry) => string | null): Map<string, Stamp> {
  const result = new Map<string, Stamp>();
  const been = Object.values(passport)
    .filter((e) => e.status === "BEEN")
    .sort((a, b) => a.at.localeCompare(b.at));
  for (const entry of been) {
    const k = key(entry);
    if (k && !result.has(k)) result.set(k, { place: entry.name, at: entry.at });
  }
  return result;
}

/** Regiones del Perú con sello (al menos un «Ya fui»), con el primer lugar y la fecha. */
export function stamps(passport: Passport): Map<string, Stamp> {
  return firstBy(passport, (e) => (entryCountry(e) === "PE" ? e.region : null));
}

/** Países con sello (el Perú incluido), con el primer lugar y la fecha. */
export function countryStamps(passport: Passport): Map<string, Stamp> {
  return firstBy(passport, entryCountry);
}

export const TOTAL_REGIONS = PERU_REGIONS.length;

/** «¡Primer sello!», «¡Ya vas por la mitad del Perú!», «¡Conoces todo el Perú!»… (regiones del Perú) */
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
    // Navegación privada o almacenamiento lleno: los sellos no se guardan, pero la página sigue.
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

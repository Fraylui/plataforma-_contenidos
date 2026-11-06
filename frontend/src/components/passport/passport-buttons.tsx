"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { BookmarkSimple, Footprints } from "@phosphor-icons/react";
import { countryName } from "@/lib/countries";
import { regionName } from "@/lib/peru-regions";
import {
  countryStamps,
  milestone,
  readPassport,
  savePassport,
  serverPassport,
  stamps,
  subscribePassport,
  TOTAL_REGIONS,
  withStatus,
  type PassportStatus,
} from "@/lib/passport";
import { cn } from "@/lib/utils";
import { Stamp } from "./stamp";

const PILL =
  "inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-semibold outline-none transition-[background-color,border-color,scale] active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring";

type Earned = { key: string; name: string; title: string; detail: string };

/** Qué sello da este «Ya fui»: la región dentro del Perú, el país fuera de él. */
function earnedStamp(
  country: string | null,
  region: string | null,
  regionsAfter: number,
  regionIsNew: boolean,
  countriesAfter: number,
  countryIsNew: boolean,
): Earned | null {
  if (country === "PE" && region) {
    const name = regionName(region) ?? region;
    return {
      key: region,
      name,
      title: regionIsNew ? (milestone(regionsAfter) ?? `¡Sello de ${name}!`) : `Ya tenías el sello de ${name}`,
      detail: `${regionsAfter} de ${TOTAL_REGIONS} regiones del Perú`,
    };
  }
  if (country) {
    const name = countryName(country);
    return {
      key: country,
      name,
      title: countryIsNew ? `¡Nuevo país: ${name}!` : `Ya tenías el sello de ${name}`,
      detail: `${countriesAfter} ${countriesAfter === 1 ? "país visitado" : "países visitados"}`,
    };
  }
  return null;
}

/**
 * «Quiero ir» y «Ya fui» en cada lugar. «Ya fui» estampa un sello en «Mis
 * viajes» (región del Perú o país) con animación de tinta y el avance. Se
 * guarda solo en este navegador.
 */
export function PassportButtons({
  slug,
  name,
  href,
  region,
  country,
  children,
}: {
  slug: string;
  name: string;
  href: string;
  region: string | null;
  country: string | null;
  /** Otra acción del lugar en la misma fila (ej. «Cómo llegar»), antes de los botones. */
  children?: React.ReactNode;
}) {
  const passport = useSyncExternalStore(subscribePassport, readPassport, serverPassport);
  const status = passport[slug]?.status ?? null;
  const placeCountry = country ?? (region ? "PE" : null);
  // Se arma al tocar «Ya fui»: muestra el sello recién puesto.
  const [earned, setEarned] = useState<Earned | null>(null);
  const [touched, setTouched] = useState(false);

  function mark(next: PassportStatus) {
    const updated = withStatus(passport, slug, { name, href, region, country: placeCountry }, next);
    savePassport(updated);
    setTouched(true);
    if (next === "BEEN" && updated[slug]?.status === "BEEN") {
      const regions = [stamps(passport).size, stamps(updated).size];
      const countries = [countryStamps(passport).size, countryStamps(updated).size];
      setEarned(earnedStamp(placeCountry, region, regions[1], regions[1] > regions[0], countries[1], countries[1] > countries[0]));
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([10, 40, 18]);
    } else {
      setEarned(null);
    }
  }

  return (
    <div className="mt-6 px-4 sm:px-0">
      <div className="flex flex-wrap gap-2">
        {children}
        <div role="group" aria-label="Mis viajes" className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={status === "WANT"}
          onClick={() => mark("WANT")}
          className={cn(
            PILL,
            status === "WANT" ? "border-sky-300 bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200" : "border-transparent bg-canvas-strong text-foreground hover:bg-accent-soft",
          )}
        >
          <BookmarkSimple weight={status === "WANT" ? "fill" : "regular"} className="size-5" aria-hidden="true" />
          Quiero ir
        </button>
        <button
          type="button"
          aria-pressed={status === "BEEN"}
          onClick={() => mark("BEEN")}
          className={cn(
            PILL,
            status === "BEEN" ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200" : "border-transparent bg-canvas-strong text-foreground hover:bg-accent-soft",
          )}
        >
          <Footprints weight={status === "BEEN" ? "fill" : "regular"} className="size-5" aria-hidden="true" />
          Ya fui
        </button>
        </div>
      </div>

      <div aria-live="polite">
        {touched && status === "BEEN" && (
          <div className="mt-4 flex items-center gap-4 rounded-card bg-surface p-4 shadow-card">
            {earned && <Stamp region={earned.key} name={earned.name} stamped year={String(new Date().getFullYear())} slam className="w-20 shrink-0" />}
            <div className="min-w-0">
              <p className="font-bold text-foreground">{earned?.title ?? "¡Guardado en Mis viajes!"}</p>
              {earned && <p className="mt-0.5 text-sm text-muted">{earned.detail}</p>}
              <Link href="/mis-viajes" className="mt-1 inline-block text-sm font-semibold text-accent hover:underline">
                Ver mis viajes
              </Link>
            </div>
          </div>
        )}
        {status === "WANT" && (
          <p className="mt-3 text-sm text-muted">
            Guardado en tu lista.{" "}
            <Link href="/mis-viajes" className="font-semibold text-accent hover:underline">
              Ver mis viajes
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

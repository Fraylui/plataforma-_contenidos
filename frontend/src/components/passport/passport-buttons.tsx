"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { BookmarkSimple, Footprints } from "@phosphor-icons/react";
import { regionName } from "@/lib/peru-regions";
import { milestone, readPassport, savePassport, serverPassport, stamps, subscribePassport, TOTAL_REGIONS, withStatus, type PassportStatus } from "@/lib/passport";
import { cn } from "@/lib/utils";
import { Stamp } from "./stamp";

const PILL =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold outline-none transition-[background-color,border-color,scale] active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring";

/**
 * «Quiero ir» y «Ya fui» en cada lugar. «Ya fui» en un lugar con región
 * estampa su sello en el Pasaporte, con animación de sello de tinta y el
 * avance («3 de 25 regiones»). Se guarda solo en este navegador.
 */
export function PassportButtons({ slug, name, href, region }: { slug: string; name: string; href: string; region: string | null }) {
  const passport = useSyncExternalStore(subscribePassport, readPassport, serverPassport);
  const status = passport[slug]?.status ?? null;
  // Se arma al tocar «Ya fui»: muestra el sello recién puesto.
  const [justStamped, setJustStamped] = useState<{ count: number; isNew: boolean } | null>(null);

  function mark(next: PassportStatus) {
    const before = stamps(passport);
    const updated = withStatus(passport, slug, { name, href, region }, next);
    savePassport(updated);
    if (next === "BEEN" && updated[slug]?.status === "BEEN") {
      const after = stamps(updated);
      setJustStamped({ count: after.size, isNew: after.size > before.size });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([10, 40, 18]);
    } else {
      setJustStamped(null);
    }
  }

  const regionLabel = regionName(region);

  return (
    <div className="mt-6 px-4 sm:px-0">
      <div role="group" aria-label="Mi Pasaporte" className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={status === "WANT"}
          onClick={() => mark("WANT")}
          className={cn(PILL, status === "WANT" ? "border-sky-300 bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200" : "border-transparent bg-canvas-strong text-foreground hover:bg-accent-soft")}
        >
          <BookmarkSimple weight={status === "WANT" ? "fill" : "regular"} className="size-5" aria-hidden="true" />
          Quiero ir
        </button>
        <button
          type="button"
          aria-pressed={status === "BEEN"}
          onClick={() => mark("BEEN")}
          className={cn(PILL, status === "BEEN" ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200" : "border-transparent bg-canvas-strong text-foreground hover:bg-accent-soft")}
        >
          <Footprints weight={status === "BEEN" ? "fill" : "regular"} className="size-5" aria-hidden="true" />
          Ya fui
        </button>
      </div>

      <div aria-live="polite">
        {justStamped && status === "BEEN" && (
          <div className="mt-4 flex items-center gap-4 rounded-card bg-surface p-4 shadow-card">
            {region && regionLabel ? (
              <Stamp region={region} name={regionLabel} stamped year={String(new Date().getFullYear())} slam className="w-20 shrink-0" />
            ) : null}
            <div className="min-w-0">
              <p className="font-bold text-foreground">
                {region && regionLabel
                  ? justStamped.isNew
                    ? (milestone(justStamped.count) ?? `¡Sello de ${regionLabel}!`)
                    : `Ya tenías el sello de ${regionLabel}`
                  : "¡Guardado en tu Pasaporte!"}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {justStamped.count} de {TOTAL_REGIONS} regiones del Perú
              </p>
              <Link href="/pasaporte" className="mt-1 inline-block text-sm font-semibold text-accent hover:underline">
                Ver mi Pasaporte
              </Link>
            </div>
          </div>
        )}
        {status === "WANT" && (
          <p className="mt-3 text-sm text-muted">
            Guardado en tu lista.{" "}
            <Link href="/pasaporte" className="font-semibold text-accent hover:underline">
              Ver mi Pasaporte
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

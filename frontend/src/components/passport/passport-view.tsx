"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { BookmarkSimple, Check, Footprints, MapTrifold, ShareNetwork } from "@phosphor-icons/react";
import { PERU_REGIONS, regionName } from "@/lib/peru-regions";
import { readPassport, serverPassport, stamps, subscribePassport, TOTAL_REGIONS, type PassportEntry } from "@/lib/passport";
import { Stamp } from "./stamp";

const noSubscribe = () => () => {};

/** «Ya conozco 4 de las 25 regiones del Perú…» para compartir. */
export function shareText(count: number): string {
  if (count === 0) return "Estoy armando mi Pasaporte del Perú: un sello por cada región que conozca.";
  if (count === TOTAL_REGIONS) return "¡Ya conozco las 25 regiones del Perú! Mira mi Pasaporte.";
  return `Ya conozco ${count} de las ${TOTAL_REGIONS} regiones del Perú. ¿Cuántas conoces tú?`;
}

/**
 * Pasaporte «Mi Perú»: los 25 sellos (puestos o por ganar), el avance, los
 * lugares donde ya fue y su lista de «Quiero ir». Se comparte como invitación
 * a que otros armen el suyo.
 */
export function PassportView() {
  const passport = useSyncExternalStore(subscribePassport, readPassport, serverPassport);
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  const [copied, setCopied] = useState(false);
  const regionStamps = stamps(passport);
  const entries = Object.entries(passport).sort(([, a], [, b]) => b.at.localeCompare(a.at));
  const been = entries.filter(([, e]) => e.status === "BEEN");
  const want = entries.filter(([, e]) => e.status === "WANT");
  const count = regionStamps.size;
  const percent = Math.round((count / TOTAL_REGIONS) * 100);

  async function share() {
    const url = `${window.location.origin}/pasaporte`;
    const text = shareText(count);
    if (navigator.share) {
      await navigator.share({ title: "Mi Pasaporte del Perú", text, url }).catch(() => {});
      return;
    }
    await navigator.clipboard?.writeText(`${text} ${url}`).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4 pb-12">
      <header className="overflow-hidden rounded-card bg-linear-to-br from-red-700 via-red-600 to-rose-500 p-5 text-white shadow-card">
        <p className="text-xs font-bold tracking-[0.2em] uppercase opacity-80">República del Perú · 25 regiones</p>
        <h1 className="mt-1 text-2xl font-extrabold">Mi Pasaporte</h1>
        <p className="mt-3 text-4xl font-black tabular-nums">
          {hydrated ? count : "–"}
          <span className="text-lg font-bold opacity-80"> de {TOTAL_REGIONS} regiones</span>
        </p>
        <div
          role="progressbar"
          aria-label="Regiones con sello"
          aria-valuemin={0}
          aria-valuemax={TOTAL_REGIONS}
          aria-valuenow={count}
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/25"
        >
          <div className="h-full rounded-full bg-white transition-[width] duration-700" style={{ width: `${percent}%` }} />
        </div>
        <button
          type="button"
          onClick={() => void share()}
          className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-red-700 outline-none focus-visible:ring-[3px] focus-visible:ring-white/60"
        >
          {copied ? <Check className="size-5" aria-hidden="true" /> : <ShareNetwork className="size-5" aria-hidden="true" />}
          {copied ? "Enlace copiado" : "Compartir mi Pasaporte"}
        </button>
      </header>

      <section aria-labelledby="sellos" className="mt-6">
        <h2 id="sellos" className="text-lg font-bold text-foreground">
          Sellos
        </h2>
        <p className="mt-0.5 text-sm text-muted">Toca «Ya fui» en un lugar para ganar el sello de su región.</p>
        <ul className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {PERU_REGIONS.map((r) => {
            const stamp = regionStamps.get(r.key);
            return (
              <li key={r.key} title={stamp ? `${r.name}: ${stamp.place}` : r.name}>
                <Stamp region={r.key} name={r.name} stamped={Boolean(stamp)} year={stamp?.at.slice(0, 4)} />
                <span className="sr-only">{stamp ? `, con sello (${stamp.place})` : ", sin sello todavía"}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {hydrated && entries.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-card border border-dashed border-border px-6 py-8 text-center">
          <MapTrifold className="size-10 text-accent" aria-hidden="true" />
          <p className="font-bold text-foreground">Tu pasaporte está esperando su primer sello</p>
          <p className="max-w-xs text-sm text-muted">Entra a un lugar y toca «Ya fui» si lo conoces o «Quiero ir» para guardarlo.</p>
          <Link
            href="/lugares"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent-fill px-5 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Ver lugares
          </Link>
        </div>
      )}

      <PlaceList id="ya-fui" title="Donde ya fui" icon={<Footprints weight="fill" className="size-5 text-emerald-600" aria-hidden="true" />} entries={been} />
      <PlaceList id="quiero-ir" title="Quiero ir" icon={<BookmarkSimple weight="fill" className="size-5 text-sky-600" aria-hidden="true" />} entries={want} />

      <p className="mt-10 text-center text-xs text-muted">Tu pasaporte se guarda solo en este celular o computadora. No necesitas cuenta.</p>
    </div>
  );
}

function PlaceList({ id, title, icon, entries }: { id: string; title: string; icon: React.ReactNode; entries: [string, PassportEntry][] }) {
  if (entries.length === 0) return null;
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="flex items-center gap-2 text-lg font-bold text-foreground">
        {icon}
        {title} <span className="text-sm font-medium text-muted">({entries.length})</span>
      </h2>
      <ul className="mt-3 divide-y divide-border overflow-hidden rounded-card bg-surface shadow-card">
        {entries.map(([slug, e]) => (
          <li key={slug}>
            <Link href={e.href} className="flex min-h-12 items-center justify-between gap-3 px-4 py-3 hover:bg-canvas">
              <span className="font-semibold text-foreground">{e.name}</span>
              {regionName(e.region) && <span className="shrink-0 text-xs text-muted">{regionName(e.region)}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { BookmarkSimple, Check, Footprints, GlobeHemisphereWest, MapTrifold, ShareNetwork } from "@phosphor-icons/react";
import { countryName } from "@/lib/countries";
import { PERU_REGIONS, regionName } from "@/lib/peru-regions";
import { countryStamps, entryCountry, readPassport, serverPassport, stamps, subscribePassport, TOTAL_REGIONS, type PassportEntry } from "@/lib/passport";
import { Stamp } from "./stamp";

const noSubscribe = () => () => {};

/** «Ya conozco 3 países y 4 de las 25 regiones del Perú…» para compartir. */
export function shareText(countries: number, regions: number): string {
  if (countries === 0) return "Estoy juntando sellos de cada país y cada región del Perú que conozca. ¿Cuántos tienes tú?";
  const c = `${countries} ${countries === 1 ? "país" : "países"}`;
  if (regions === TOTAL_REGIONS) return `¡Ya conozco ${c} y las 25 regiones del Perú! ¿Cuántos sellos tienes tú?`;
  if (regions === 0) return `Ya tengo sellos de ${c}. ¿Cuántos tienes tú?`;
  return `Ya conozco ${c} y ${regions} de las ${TOTAL_REGIONS} regiones del Perú. ¿Cuántos sellos tienes tú?`;
}

/**
 * «Mis viajes»: los sellos de cada país visitado, los 25 de las regiones del
 * Perú (puestos o por ganar), los lugares donde ya fue y su lista de «Quiero
 * ir». Se comparte como invitación a que otros armen el suyo.
 */
export function PassportView() {
  const passport = useSyncExternalStore(subscribePassport, readPassport, serverPassport);
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  const [copied, setCopied] = useState(false);
  const regionStamps = stamps(passport);
  const worldStamps = countryStamps(passport);
  const countries = worldStamps.size;
  const entries = Object.entries(passport).sort(([, a], [, b]) => b.at.localeCompare(a.at));
  const been = entries.filter(([, e]) => e.status === "BEEN");
  const want = entries.filter(([, e]) => e.status === "WANT");
  const count = regionStamps.size;
  const percent = Math.round((count / TOTAL_REGIONS) * 100);

  async function share() {
    const url = `${window.location.origin}/mis-viajes`;
    const text = shareText(countries, count);
    if (navigator.share) {
      await navigator.share({ title: "Mis viajes", text, url }).catch(() => {});
      return;
    }
    await navigator.clipboard?.writeText(`${text} ${url}`).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4 pb-12">
      <header className="overflow-hidden rounded-card bg-linear-to-br from-indigo-700 via-violet-600 to-rose-500 p-5 text-white shadow-card">
        <p className="text-xs font-bold tracking-[0.2em] uppercase opacity-80">Sellos de viaje</p>
        <h1 className="mt-1 text-2xl font-extrabold">Mis viajes</h1>
        <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-1">
          <p className="text-4xl font-black tabular-nums">
            {hydrated ? countries : "–"}
            <span className="text-lg font-bold opacity-80"> {countries === 1 ? "país" : "países"}</span>
          </p>
          <p className="pb-1 text-lg font-bold tabular-nums opacity-90">
            {hydrated ? count : "–"} de {TOTAL_REGIONS} regiones del Perú
          </p>
        </div>
        <div
          role="progressbar"
          aria-label="Regiones del Perú con sello"
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
          className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-violet-700 outline-none focus-visible:ring-[3px] focus-visible:ring-white/60"
        >
          {copied ? <Check className="size-5" aria-hidden="true" /> : <ShareNetwork className="size-5" aria-hidden="true" />}
          {copied ? "Enlace copiado" : "Compartir mis sellos"}
        </button>
      </header>

      {/* Lo vacío no aparece: «Por el mundo» sale con el primer sello de país. */}
      {countries > 0 && (
      <section aria-labelledby="mundo" className="mt-6">
        <h2 id="mundo" className="flex items-center gap-2 text-lg font-bold text-foreground">
          <GlobeHemisphereWest weight="fill" className="size-5 text-violet-600" aria-hidden="true" />
          Por el mundo
        </h2>
        <p className="mt-0.5 text-sm text-muted">Un sello por cada país donde estuviste.</p>
        <ul className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {[...worldStamps.entries()].map(([code, stamp]) => (
            <li key={code} title={`${countryName(code)}: ${stamp.place}`}>
              <Stamp region={code} name={countryName(code)} stamped year={stamp.at.slice(0, 4)} />
              <span className="sr-only">, con sello ({stamp.place})</span>
            </li>
          ))}
          <li>
            <Stamp region="?" name="Tu próximo país" stamped={false} />
          </li>
        </ul>
      </section>
      )}

      <section aria-labelledby="sellos" className="mt-8">
        <h2 id="sellos" className="text-lg font-bold text-foreground">
          Regiones del Perú
        </h2>
        <p className="mt-0.5 text-sm text-muted">En el Perú, cada región tiene su propio sello.</p>
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
          <p className="font-bold text-foreground">Tus viajes esperan su primer sello</p>
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

      <p className="mt-10 text-center text-xs text-muted">Tus sellos se guardan solo en este celular o computadora. No necesitas cuenta.</p>
    </div>
  );
}

/** «Ayacucho» dentro del Perú; «Bolivia» fuera. */
function placeWhere(e: PassportEntry): string | null {
  const country = entryCountry(e);
  if (country === "PE") return regionName(e.region) ?? countryName("PE");
  return country ? countryName(country) : null;
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
              {placeWhere(e) && <span className="shrink-0 text-xs text-muted">{placeWhere(e)}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

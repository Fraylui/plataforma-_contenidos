"use client";

import { useState } from "react";
import { MapTrifold, NavigationArrow } from "@phosphor-icons/react";
import { mapsDirections } from "./post-actions";
import { cn } from "@/lib/utils";

/**
 * Mapa que se carga al tocarlo. Antes, un mapa ilustrado propio (SVG, sin
 * pedir nada a Google): la página no se pone lenta y Google no recibe la
 * visita ni pone cookies hasta que la persona elige ver el mapa (coherente
 * con el aviso de cookies y la Ley 29733). Al tocar, el mapa real aparece
 * en el mismo lugar con un fundido.
 */
export function LazyMap({ latitude, longitude, title }: { latitude: number; longitude: number; title: string }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="overflow-hidden rounded-card bg-surface shadow-card">
      <div className="relative aspect-video w-full bg-canvas-strong">
        {!loaded && <MapIllustration animate={!open} />}
        {open && (
          <iframe
            src={`https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
            title={`Mapa de ${title}`}
            onLoad={() => setLoaded(true)}
            className={cn("absolute inset-0 h-full w-full transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0")}
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group absolute inset-0 flex cursor-pointer items-end justify-center pb-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-inset"
          >
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface/95 px-5 text-sm font-bold text-foreground shadow-card backdrop-blur transition-transform group-hover:scale-105 group-active:scale-95">
              <MapTrifold weight="fill" className="size-5 text-accent" aria-hidden="true" />
              Ver mapa
            </span>
          </button>
        )}
        {open && !loaded && (
          <span role="status" className="absolute inset-x-0 bottom-4 text-center text-sm font-semibold text-foreground">
            Cargando mapa…
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <a
          href={mapsDirections(latitude, longitude)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-accent-fill px-4 text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          <NavigationArrow weight="fill" className="size-4" aria-hidden="true" />
          Cómo llegar
        </a>
        <p className="text-xs text-muted">{open ? "Mapa de Google" : "El mapa es de Google: se carga al tocarlo."}</p>
      </div>
    </div>
  );
}

/** Calles, un río y manzanas dibujados a mano, con el pin que cae y late en el centro. */
function MapIllustration({ animate }: { animate: boolean }) {
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true" className="absolute inset-0 h-full w-full text-foreground" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="180" className="fill-canvas-strong" />
      {/* Manzanas */}
      <g className="fill-surface" opacity="0.7">
        <rect x="18" y="14" width="70" height="40" rx="6" />
        <rect x="104" y="14" width="56" height="40" rx="6" />
        <rect x="18" y="70" width="44" height="46" rx="6" />
        <rect x="200" y="20" width="96" height="34" rx="6" />
        <rect x="214" y="70" width="40" height="40" rx="6" />
        <rect x="266" y="70" width="40" height="40" rx="6" />
        <rect x="30" y="132" width="80" height="36" rx="6" />
        <rect x="214" y="126" width="92" height="42" rx="6" />
      </g>
      {/* Río */}
      <path d="M-10 150 C 60 120, 90 175, 160 140 S 260 110, 340 130" fill="none" className="stroke-sky-400/60" strokeWidth="10" strokeLinecap="round" />
      {/* Calles */}
      <g fill="none" stroke="currentColor" strokeLinecap="round" opacity="0.18">
        <path d="M0 62 H320" strokeWidth="6" />
        <path d="M96 0 V180" strokeWidth="6" />
        <path d="M190 0 C 186 60, 200 120, 196 180" strokeWidth="6" />
        <path d="M0 124 C 80 116, 140 128, 320 118" strokeWidth="4" />
        <path d="M150 62 L 250 180" strokeWidth="3" />
      </g>
      {/* Pin */}
      <g transform="translate(160 92)">
        <circle r="16" className={cn("fill-accent/25", animate && "origin-center motion-safe:animate-[ink-ring_1.8s_ease-out_infinite]")} />
        <g className={cn(animate && "motion-safe:animate-[pin-drop_600ms_cubic-bezier(.2,.9,.3,1.3)_both]")}>
          <path d="M0 -30 C -11 -30 -18 -22 -18 -13 C -18 -1 0 12 0 12 C 0 12 18 -1 18 -13 C 18 -22 11 -30 0 -30 Z" className="fill-accent" />
          <circle cy="-14" r="6" className="fill-surface" />
        </g>
      </g>
    </svg>
  );
}

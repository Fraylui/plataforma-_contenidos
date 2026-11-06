"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { readPassport, serverPassport, stamps, subscribePassport } from "@/lib/passport";
import { Stamp } from "./stamp";

/**
 * El sello de la región en su página, pequeño, solo si la persona ya lo ganó
 * en «Mis viajes» (sin sello no se muestra un círculo vacío; la frase de la
 * portada ya invita a ganarlo). Lleva a «Mis viajes».
 */
export function RegionStampBadge({ region, name }: { region: string; name: string }) {
  const passport = useSyncExternalStore(subscribePassport, readPassport, serverPassport);
  const stamp = stamps(passport).get(region);
  if (!stamp) return null;
  return (
    <Link
      href="/mis-viajes"
      className="absolute top-3 right-3 block w-14 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-white/70 sm:top-4 sm:right-4 sm:w-16"
    >
      {/* Fondo blanco: el sello se lee sobre cualquier foto de portada. */}
      <span className="block rounded-full bg-white/95 shadow-pop [&_span]:text-[8px]">
        <Stamp region={region} name={name} stamped year={stamp.at.slice(0, 4)} />
      </span>
      <span className="sr-only">Ya tienes el sello de {name}. Ver mis viajes</span>
    </Link>
  );
}

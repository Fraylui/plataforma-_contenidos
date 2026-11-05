"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { readPassport, serverPassport, stamps, subscribePassport } from "@/lib/passport";
import { Stamp } from "./stamp";

/**
 * El sello de la región en su página: a color si la persona ya lo ganó en
 * «Mis viajes», punteado si todavía no. Lleva a «Mis viajes».
 */
export function RegionStampBadge({ region, name }: { region: string; name: string }) {
  const passport = useSyncExternalStore(subscribePassport, readPassport, serverPassport);
  const stamp = stamps(passport).get(region);
  return (
    <Link href="/mis-viajes" className="block w-20 shrink-0 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-white/70 sm:w-24">
      {/* Fondo blanco: el sello se lee sobre cualquier foto de portada. */}
      <span className="block rounded-full bg-white/95 shadow-pop">
        <Stamp region={region} name={name} stamped={Boolean(stamp)} year={stamp?.at.slice(0, 4)} />
      </span>
      <span className="sr-only">{stamp ? `Ya tienes el sello de ${name}. Ver mis viajes` : `Sello de ${name}: aún no lo tienes. Ver mis viajes`}</span>
    </Link>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import { celebrationDateParts, countdownLabel } from "@/lib/celebration-date";

const noSubscription = () => () => {};

/**
 * Sello de la portada de una celebración: el día y el mes grandes (como una
 * hoja de calendario) y cuánto falta. La cuenta regresiva se calcula en el
 * navegador: la página se guarda en caché y en el servidor quedaría vieja.
 */
export function CelebrationStamp({ nextAt }: { nextAt: string }) {
  const { day, month } = celebrationDateParts(nextAt);
  const countdown = useSyncExternalStore(noSubscription, () => countdownLabel(nextAt, new Date()), () => null);
  return (
    <div data-testid="celebration-stamp" className="flex items-center gap-3">
      <div className="flex w-16 flex-col items-center overflow-hidden rounded-control bg-surface text-foreground shadow-card">
        {/* En minúscula como los cuadritos de fecha del feed («31 oct»): no es un antetítulo. */}
        <span className="w-full bg-accent-fill py-0.5 text-center text-xs font-bold text-accent-foreground">
          {month}
        </span>
        <span className="py-1 text-3xl leading-none font-black tabular-nums">{day}</span>
      </div>
      {countdown && (
        <span className="rounded-full bg-black/45 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-md">{countdown}</span>
      )}
    </div>
  );
}

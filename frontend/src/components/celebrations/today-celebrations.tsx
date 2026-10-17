"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CaretRight, Confetti } from "@phosphor-icons/react";
import { SkeletonImage } from "@/components/ui/skeleton-image";

/** Ya resuelta en el servidor (ver lib/today-celebrations.ts). */
export interface TodayCelebration {
  id: string;
  slug: string;
  title: string;
  /** Para next/image (URL alcanzable desde Next). */
  coverSrc: string | null;
  /** Enlace externo pegado por quien redacta. */
  externalCoverUrl: string | null;
  dateLabel: string;
}

/**
 * «Hoy se celebra» (spec 2026-10-16), como el Doodle de Google: solo aparece
 * el día que toca una celebración, y cada visitante ve lo de su lugar
 * (spec celebraciones por geografía). La página trae en caché lo de quien no
 * tiene ubicación conocida (lo mundial y lo del país del sitio); al cargar,
 * el navegador pide lo de su región y país y lo reemplaza. La primera va
 * como tarjeta con su foto; si hay más, quedan como enlaces debajo. Sin
 * fechas hoy no se dibuja nada (nunca un hueco).
 */
export function TodayCelebrations({ initial }: { initial: TodayCelebration[] }) {
  const [dates, setDates] = useState(initial);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/celebrations/today", { signal: controller.signal })
      .then((res) => (res.status === 200 ? (res.json() as Promise<TodayCelebration[]>) : null))
      .then((local) => {
        if (local) setDates(local);
      })
      // Sin red o abortado: se queda lo que vino en la página.
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (dates.length === 0) return null;
  const [main, ...rest] = dates;

  return (
    <section aria-labelledby="hoy-se-celebra" className="mb-3">
      <Link
        href={`/celebraciones/${main.slug}`}
        className="group relative flex min-h-36 overflow-hidden rounded-card bg-linear-to-br from-accent-fill to-emerald-700 shadow-card focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
      >
        {main.coverSrc ? (
          // Arriba de todo en el inicio: es la imagen principal de la pantalla (LCP), con prioridad como la primera del feed.
          <SkeletonImage src={main.coverSrc} alt="" priority className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(min-width: 640px) 630px, 100vw" />
        ) : main.externalCoverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- enlace externo pegado por quien redacta, host arbitrario
          <img src={main.externalCoverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        {/* Degradado para leer el texto blanco sobre cualquier foto (contraste AA). */}
        <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/10" />
        <span className="relative mt-auto flex w-full items-end justify-between gap-3 p-4 text-white">
          <span className="min-w-0">
            <span id="hoy-se-celebra" className="flex items-center gap-1.5 text-sm font-bold">
              <Confetti className="size-4" weight="fill" aria-hidden="true" />
              Hoy se celebra
            </span>
            <span className="mt-1 block text-xl leading-tight font-extrabold tracking-tight">{main.title}</span>
            <span className="mt-0.5 block text-sm text-white/85">{main.dateLabel}</span>
          </span>
          <CaretRight className="size-5 shrink-0" weight="bold" aria-hidden="true" />
        </span>
      </Link>
      {rest.length > 0 && (
        <p className="mt-2 px-1 text-sm text-muted">
          También hoy:{" "}
          {rest.map((date, i) => (
            <span key={date.id}>
              {i > 0 && ", "}
              <Link href={`/celebraciones/${date.slug}`} className="font-semibold text-foreground hover:underline">
                {date.title}
              </Link>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import { ArrowUp, CheckCircle, Compass } from "@phosphor-icons/react";

const PILL =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring";

/**
 * Cierre del feed cuando ya no queda nada por ver (como «Estás al día» de
 * Instagram): en vez de cortarse sin aviso, invita a seguir en Explorar o a
 * volver arriba.
 */
export function FeedEnd() {
  return (
    <section aria-label="Fin del feed" className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-teal-600 text-white shadow-md">
        <CheckCircle weight="fill" className="size-8" aria-hidden="true" />
      </span>
      <p className="text-lg font-bold text-foreground">¡Ya lo viste todo!</p>
      <p className="max-w-xs text-sm text-muted">Vuelve pronto: siempre hay algo nuevo. Mientras, descubre más por temas.</p>
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        <Link href="/explorar" className={`${PILL} bg-accent-fill text-accent-foreground hover:opacity-90`}>
          <Compass className="size-5" aria-hidden="true" />
          Explorar
        </Link>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
          className={`${PILL} border border-border text-foreground hover:bg-canvas`}
        >
          <ArrowUp className="size-5" aria-hidden="true" />
          Volver arriba
        </button>
      </div>
    </section>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Observabilidad mínima en cliente mientras no hay un colector de errores (sección 28, progresivo)
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent">
        <TriangleAlert className="h-8 w-8" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Algo no funcionó como esperábamos
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
        No pudimos cargar este contenido. Puede ser temporal — intenta de nuevo en unos segundos.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-full border border-foreground/[0.08] bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent/50 hover:text-accent"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

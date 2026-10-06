"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowClockwise, House, WarningCircle } from "@phosphor-icons/react";

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
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-canvas-strong text-foreground">
        <WarningCircle className="h-10 w-10" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-foreground">Algo no salió bien</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        No pudimos cargar esto. Suele ser temporal: vuelve a intentarlo en unos segundos.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-accent-fill px-5 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90"
        >
          <ArrowClockwise className="h-4 w-4" weight="bold" aria-hidden="true" />
          Reintentar
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-canvas-strong px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent-soft hover:text-accent"
        >
          <House className="h-4 w-4" aria-hidden="true" />
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}

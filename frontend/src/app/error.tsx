"use client";

import { useEffect } from "react";

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
      <h1 className="text-2xl font-semibold text-foreground">
        Algo no funcionó como esperábamos
      </h1>
      <p className="mt-2 text-sm text-muted">
        No pudimos cargar este contenido. Puede ser temporal — intenta de nuevo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90"
      >
        Reintentar
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import { Button, buttonClass } from "@/components/ui";

/**
 * Error dentro del panel: se queda en el panel (menú y barra siguen ahí),
 * explica en simple y ofrece reintentar. Nunca muestra el mensaje técnico;
 * el código sirve para encontrarlo en los registros del servidor.
 */
export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-3 rounded-card bg-surface px-6 py-12 text-center shadow-card">
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger-ink">
        <WarningCircle weight="fill" aria-hidden="true" className="size-6" />
      </span>
      <h1 className="text-lg font-bold text-foreground">Algo salió mal al cargar esta sección</h1>
      <p className="text-sm text-muted">Puede ser un corte momentáneo. Vuelve a intentarlo; si sigue pasando, avisa con este código.</p>
      {error.digest && <p className="rounded-control bg-field px-2 py-1 font-mono text-xs text-muted">Código: {error.digest}</p>}
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button onClick={() => retry()} icon={<ArrowClockwise weight="bold" aria-hidden="true" />}>
          Reintentar
        </Button>
        <Link href="/admin" className={buttonClass("secondary")}>
          Ir al inicio del panel
        </Link>
      </div>
    </div>
  );
}

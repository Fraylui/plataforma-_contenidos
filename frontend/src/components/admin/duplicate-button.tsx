"use client";

import { useState, useTransition } from "react";
import { Copy } from "@phosphor-icons/react";
import type { ActionResult } from "@/lib/admin/action-helpers";
import { Button } from "@/components/ui";

/**
 * «Duplicar»: crea una copia en borrador («Copia de …») con el mismo texto,
 * fotos, videos y tema, y abre la copia. Para series de listas, guías
 * parecidas o lo que se repite cada año.
 */
export function DuplicateButton({ action }: { action: () => Promise<ActionResult> }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="secondary"
        icon={<Copy aria-hidden="true" />}
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            // Si sale bien, la acción redirige a la copia y esta promesa no vuelve.
            const result = await action();
            if (!result.ok) setError(result.error);
          })
        }
      >
        Duplicar
      </Button>
      {error && (
        <p role="alert" className="text-xs text-danger-ink">
          {error}
        </p>
      )}
    </div>
  );
}

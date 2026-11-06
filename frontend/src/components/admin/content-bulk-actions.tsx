"use client";

import { useState } from "react";
import { toast } from "sonner";
import { publicationStepAction } from "@/app/admin/(protected)/publication-actions";
import type { PublicationKind } from "@/lib/admin/publication";
import { Button } from "@/components/ui";

export interface BulkPermissionCheck<T> {
  canPublish: (item: T) => boolean;
  canArchive: (item: T) => boolean;
}

/**
 * Barra de acciones en lote, genérica para las 6 tablas de contenido —
 * mismo criterio que ContentRowActions (un componente compartido en vez
 * de 6 copias casi iguales). Publicar y archivar son las dos acciones en
 * lote; enviar para aprobar y devolver a borrador (con nota) van por fila.
 *
 * No hay endpoint bulk en el backend — cada Server Action (publish/archive)
 * ya valida permisos y estado por ítem del lado del servidor, así que
 * disparar N requests en paralelo (Promise.allSettled) es tan seguro como
 * hacerlo uno por uno desde la fila, solo que de una vez. Con el catálogo
 * actual (~30 ítems por tipo) esto no es un problema de escala; si crece
 * mucho, ahí sí se justifica un endpoint bulk real.
 */
export function ContentBulkActions<T extends { id: string }>({
  selected,
  permissions,
  kind,
  onDone,
}: {
  selected: T[];
  permissions: BulkPermissionCheck<T>;
  kind: PublicationKind;
  /** Se llama tras terminar (éxito o no) — el padre limpia la selección y hace router.refresh(). */
  onDone: () => void;
}) {
  const [pending, setPending] = useState<"publish" | "archive" | null>(null);

  if (selected.length === 0) return null;

  const publishable = selected.filter(permissions.canPublish);
  const archivable = selected.filter(permissions.canArchive);

  async function run(step: "publish" | "archive", items: T[]) {
    if (items.length === 0) return;
    setPending(step);
    const results = await Promise.allSettled(items.map((item) => publicationStepAction(kind, item.id, step)));
    setPending(null);

    const failed = results.filter((r) => r.status === "rejected" || !r.value.ok).length;
    const succeeded = items.length - failed;
    const verb = step === "publish" ? "publicad" : "archivad";
    if (failed === 0) {
      toast.success(`${succeeded} ${verb}${succeeded === 1 ? "o" : "os"}.`);
    } else {
      toast.warning(`${succeeded} de ${items.length} ${verb}os — ${failed} fallaron.`);
    }
    onDone();
  }

  return (
    <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-3 rounded-card bg-accent-soft px-4 py-2.5 text-sm shadow-card">
      <span className="font-medium text-foreground">
        {selected.length} seleccionado{selected.length === 1 ? "" : "s"}
      </span>
      <Button
        type="button"
        variant="secondary"
        disabled={publishable.length === 0 || pending !== null}
        onClick={() => run("publish", publishable)}
      >
        {pending === "publish" ? "Publicando…" : `Publicar (${publishable.length})`}
      </Button>
      <Button
        type="button"
        variant="secondary"
        disabled={archivable.length === 0 || pending !== null}
        onClick={() => run("archive", archivable)}
      >
        {pending === "archive" ? "Archivando…" : `Archivar (${archivable.length})`}
      </Button>
    </div>
  );
}

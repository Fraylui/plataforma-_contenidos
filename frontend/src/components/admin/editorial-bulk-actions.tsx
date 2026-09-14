"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminButton } from "@/components/admin/ui";
import type { ActionResult } from "@/lib/admin/action-helpers";

export interface BulkPermissionCheck<T> {
  canPublish: (item: T) => boolean;
  canArchive: (item: T) => boolean;
}

export interface BulkActions {
  publish: (id: string) => Promise<ActionResult>;
  archive: (id: string) => Promise<ActionResult>;
}

/**
 * Barra de acciones en lote, genérica para las 6 tablas de contenido —
 * mismo criterio que EditorialRowActions (un componente compartido en vez
 * de 6 copias casi iguales). Publicar/archivar son las dos únicas acciones
 * en lote (enviar a revisión/aprobar/rechazar quedan por fila: rechazar
 * necesita un motivo por ítem, y las otras dos son pasos intermedios menos
 * frecuentes de tocar en bloque).
 *
 * No hay endpoint bulk en el backend — cada Server Action (publish/archive)
 * ya valida permisos y estado por ítem del lado del servidor, así que
 * disparar N requests en paralelo (Promise.allSettled) es tan seguro como
 * hacerlo uno por uno desde la fila, solo que de una vez. Con el catálogo
 * actual (~30 ítems por tipo) esto no es un problema de escala; si crece
 * mucho, ahí sí se justifica un endpoint bulk real.
 */
export function EditorialBulkActions<T extends { id: string }>({
  selected,
  permissions,
  actions,
  onDone,
}: {
  selected: T[];
  permissions: BulkPermissionCheck<T>;
  actions: BulkActions;
  /** Se llama tras terminar (éxito o no) — el padre limpia la selección y hace router.refresh(). */
  onDone: () => void;
}) {
  const [pending, setPending] = useState<"publish" | "archive" | null>(null);

  if (selected.length === 0) return null;

  const publishable = selected.filter(permissions.canPublish);
  const archivable = selected.filter(permissions.canArchive);

  async function run(kind: "publish" | "archive", items: T[], action: (id: string) => Promise<ActionResult>) {
    if (items.length === 0) return;
    setPending(kind);
    const results = await Promise.allSettled(items.map((item) => action(item.id)));
    setPending(null);

    const failed = results.filter((r) => r.status === "rejected" || !r.value.ok).length;
    const succeeded = items.length - failed;
    const verb = kind === "publish" ? "publicad" : "archivad";
    if (failed === 0) {
      toast.success(`${succeeded} ${verb}${succeeded === 1 ? "o" : "os"}.`);
    } else {
      toast.warning(`${succeeded} de ${items.length} ${verb}os — ${failed} fallaron.`);
    }
    onDone();
  }

  return (
    <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-accent/40 bg-accent-soft px-4 py-2.5 text-sm">
      <span className="font-medium text-foreground">
        {selected.length} seleccionado{selected.length === 1 ? "" : "s"}
      </span>
      <AdminButton
        type="button"
        variant="secondary"
        disabled={publishable.length === 0 || pending !== null}
        onClick={() => run("publish", publishable, actions.publish)}
      >
        {pending === "publish" ? "Publicando…" : `Publicar (${publishable.length})`}
      </AdminButton>
      <AdminButton
        type="button"
        variant="secondary"
        disabled={archivable.length === 0 || pending !== null}
        onClick={() => run("archive", archivable, actions.archive)}
      >
        {pending === "archive" ? "Archivando…" : `Archivar (${archivable.length})`}
      </AdminButton>
    </div>
  );
}

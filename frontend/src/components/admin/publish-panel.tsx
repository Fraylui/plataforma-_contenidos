"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarCheck, FloppyDisk, PaperPlaneTilt, X } from "@phosphor-icons/react";
import { ArchiveButton } from "@/components/admin/ui";
import { Badge, Button, DateTimeInput, Field } from "@/components/ui";
import { publicationStepAction } from "@/app/admin/(protected)/publication-actions";
import { formatEventDateTime, publicationStatusLabel, publicationStatusTone } from "@/lib/content-labels";
import { PUBLICATION_KINDS, type PublicationKind, type PublicationPermissions, type PublicationStep } from "@/lib/admin/publication";
import type { PublicationStatus } from "@/lib/api/types";
import { SITE_TIME_ZONE } from "@/lib/site-time-zone";

export interface PublishPanelItem {
  id: string;
  status: PublicationStatus;
  scheduledAt: string | null;
}

interface PublishPanelProps {
  kind: PublicationKind;
  item: PublishPanelItem;
  permissions: PublicationPermissions;
  /** Hay cambios del formulario sin guardar: publicar guarda primero. */
  dirty: boolean;
  saving: boolean;
  /** Guarda el formulario; devuelve el id guardado, o null si no se pudo (el formulario muestra el error). */
  onSave: () => Promise<string | null>;
  /** Hora del último guardado (manual o automático). */
  savedAt?: Date | null;
}

const SUCCESS: Record<PublicationStep, string> = {
  publish: "Publicado",
  schedule: "Programado",
  "return-to-draft": "Volvió a borrador",
  archive: "Archivado",
};

const TIME = new Intl.DateTimeFormat("es-PE", { timeZone: SITE_TIME_ZONE, hour: "numeric", minute: "2-digit" });

/**
 * Panel "Publicar" de los 5 tipos de contenido: quien tiene el módulo publica
 * directo, sin paso de aprobación (decisión del dueño 2026-10-15). Publicar,
 * guardar, programar, quitar la programación y archivar.
 */
export function PublishPanel({ kind, item, permissions, dirty, saving, onSave, savedAt }: PublishPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<PublicationStep | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");

  const isScheduled = item.status === "SCHEDULED";
  const working = saving || busy !== null;

  async function run(step: PublicationStep, body?: { scheduledAt?: string }) {
    setBusy(step);
    try {
      let id: string | null = item.id;
      // Sin id = aún no existe (compositor nuevo): se crea antes de publicar.
      if ((dirty || !id) && step !== "archive" && step !== "return-to-draft") {
        id = await onSave();
        if (!id) return;
      }
      const result = await publicationStepAction(kind, id, step, body);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(SUCCESS[step]);
      setScheduling(false);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    const id = await onSave();
    if (id) toast.success("Cambios guardados");
  }

  const saveLabel = item.status === "DRAFT" ? "Guardar borrador" : "Guardar cambios";
  const primaryIsSave = !permissions.canPublish;

  return (
    <section aria-label="Publicar" className="space-y-4 rounded-card bg-surface p-5 shadow-card">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight text-foreground">Publicar</h2>
        <Badge tone={publicationStatusTone(item.status)} dot>
          {publicationStatusLabel(item.status)}
        </Badge>
      </header>


      {isScheduled && item.scheduledAt && (
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CalendarCheck weight="fill" aria-hidden="true" className="size-4 shrink-0 text-warning" />
          {`Se publicará ${formatEventDateTime(item.scheduledAt)}`}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {permissions.canPublish && (
          <Button size="lg" icon={<PaperPlaneTilt weight="fill" aria-hidden="true" />} loading={busy === "publish"} disabled={working} onClick={() => run("publish")}>
            {isScheduled ? "Publicar ahora" : "Publicar"}
          </Button>
        )}
        {permissions.canEdit && (
          <Button
            size={primaryIsSave ? "lg" : "md"}
            variant={primaryIsSave ? "primary" : "secondary"}
            icon={<FloppyDisk aria-hidden="true" />}
            loading={saving && busy === null}
            disabled={working}
            onClick={save}
          >
            {saveLabel}
          </Button>
        )}
        {permissions.canSchedule && !scheduling && (
          <Button variant="ghost" icon={<CalendarCheck aria-hidden="true" />} disabled={working} onClick={() => setScheduling(true)}>
            {isScheduled ? "Cambiar fecha" : "Programar"}
          </Button>
        )}
      </div>

      {scheduling && (
        <div className="space-y-3 rounded-control bg-field p-3">
          <Field label="Fecha y hora de publicación" name="publish-schedule-at">
            <DateTimeInput value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!scheduleAt || working}
              loading={busy === "schedule"}
              onClick={() => run("schedule", { scheduledAt: new Date(scheduleAt).toISOString() })}
            >
              Confirmar programación
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setScheduling(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {(permissions.canReturnToDraft || permissions.canArchive) && (
        <div className="flex flex-wrap gap-2 border-t border-field-border pt-4">
          {permissions.canReturnToDraft && (
            <Button size="sm" variant="ghost" icon={<X aria-hidden="true" />} disabled={working} onClick={() => run("return-to-draft")}>
              Quitar programación
            </Button>
          )}
          {permissions.canArchive && (
            <ArchiveButton itemLabel={`esta ${PUBLICATION_KINDS[kind].noun}`} disabled={working} onConfirm={() => run("archive")} />
          )}
        </div>
      )}

      {savedAt && (
        <p className="text-xs text-muted" aria-live="polite">
          Guardado · {TIME.format(savedAt)}
        </p>
      )}

    </section>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarCheck, ChatCircleText, FloppyDisk, PaperPlaneTilt, X } from "@phosphor-icons/react";
import { ArchiveButton, Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/admin/ui";
import { Badge, Button, DateTimeInput, Field, TextArea } from "@/components/ui";
import { publicationStepAction } from "@/app/admin/(protected)/publication-actions";
import { formatEventDateTime, publicationStatusLabel, publicationStatusTone } from "@/lib/content-labels";
import { PUBLICATION_KINDS, type PublicationKind, type PublicationPermissions, type PublicationStep } from "@/lib/admin/publication";
import type { PublicationStatus } from "@/lib/api/types";
import { SITE_TIME_ZONE } from "@/lib/site-time-zone";

export interface PublishPanelItem {
  id: string;
  status: PublicationStatus;
  scheduledAt: string | null;
  reviewNote: string | null;
}

interface PublishPanelProps {
  kind: PublicationKind;
  item: PublishPanelItem;
  permissions: PublicationPermissions;
  /** Hay cambios del formulario sin guardar: publicar o enviar guarda primero. */
  dirty: boolean;
  saving: boolean;
  /** Guarda el formulario; devuelve el id guardado, o null si no se pudo (el formulario muestra el error). */
  onSave: () => Promise<string | null>;
  /** Hora del último guardado (manual o automático). */
  savedAt?: Date | null;
}

const SUCCESS: Record<PublicationStep, string> = {
  submit: "Enviado para aprobar",
  publish: "Publicado",
  schedule: "Programado",
  "return-to-draft": "Volvió a borrador",
  archive: "Archivado",
};

const TIME = new Intl.DateTimeFormat("es-PE", { timeZone: SITE_TIME_ZONE, hour: "numeric", minute: "2-digit" });

/**
 * Panel "Publicar" de los 5 tipos de contenido: una acción principal según
 * el permiso y el estado (spec 2026-10-07 §2). Quien publica ve «Publicar»;
 * quien solo crea, «Enviar para aprobar». Sin pasos de redacción.
 */
export function PublishPanel({ kind, item, permissions, dirty, saving, onSave, savedAt }: PublishPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<PublicationStep | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [returning, setReturning] = useState(false);
  const [note, setNote] = useState("");

  const isScheduled = item.status === "SCHEDULED";
  const working = saving || busy !== null;

  async function run(step: PublicationStep, body?: { scheduledAt?: string; note?: string }) {
    setBusy(step);
    try {
      let id: string | null = item.id;
      // Sin id = aún no existe (compositor nuevo): se crea antes de publicar o enviar.
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
      setReturning(false);
      setNote("");
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
  const primaryIsSave = !permissions.canPublish && !permissions.canSubmit;

  return (
    <section aria-label="Publicar" className="space-y-4 rounded-card bg-surface p-5 shadow-card">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight text-foreground">Publicar</h2>
        <Badge tone={publicationStatusTone(item.status)} dot>
          {publicationStatusLabel(item.status)}
        </Badge>
      </header>

      {item.status === "DRAFT" && item.reviewNote && (
        <p role="note" className="flex gap-2 rounded-control bg-info-soft px-3 py-2.5 text-sm text-foreground">
          <ChatCircleText weight="fill" aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
          <span>{item.reviewNote}</span>
        </p>
      )}

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
        {permissions.canSubmit && (
          <Button size="lg" icon={<PaperPlaneTilt weight="fill" aria-hidden="true" />} loading={busy === "submit"} disabled={working} onClick={() => run("submit")}>
            Enviar para aprobar
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
          {permissions.canReturnToDraft && item.status === "IN_REVIEW" && (
            <Button size="sm" variant="ghost" icon={<ChatCircleText aria-hidden="true" />} disabled={working} onClick={() => setReturning(true)}>
              Devolver a borrador
            </Button>
          )}
          {permissions.canReturnToDraft && isScheduled && (
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

      <Dialog open={returning} onOpenChange={setReturning}>
        <DialogContent>
          <DialogTitle>Devolver a borrador</DialogTitle>
          <DialogDescription>Quien lo creó podrá corregirlo y volver a enviarlo.</DialogDescription>
          <Field label="Nota para quien lo creó (opcional)" name="return-note" className="mt-4">
            <TextArea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReturning(false)}>
              Cancelar
            </Button>
            <Button loading={busy === "return-to-draft"} onClick={() => run("return-to-draft", { note: note.trim() || undefined })}>
              Devolver
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

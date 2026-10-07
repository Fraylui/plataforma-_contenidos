"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import type { AdminImage, ContentVideoInput, EventInput, PlaceOption } from "@/lib/api/admin-types";
import type { Category, ContentImage, Event } from "@/lib/api/types";
import type { EventPermissions } from "@/lib/admin/event-permissions";
import { articleStatusLabel } from "@/lib/content-labels";
import { ArchiveButton, FormError } from "@/components/admin/ui";
import { Button, Card, CollapsibleCard, Combobox, DateTimeInput, Field, TextArea, TextInput } from "@/components/ui";
import { ContentImagesPicker } from "./content-images-picker";
import { VideoLinksEditor } from "./video-links-editor";
import { RichTextEditor } from "./rich-text-editor";
import {
  approveEventAction,
  archiveEventAction,
  createEventAction,
  publishEventAction,
  rejectEventAction,
  scheduleEventAction,
  submitEventAction,
  updateEventAction,
  type ActionResult,
} from "@/app/admin/(protected)/eventos/actions";

const ROBOTS_OPTIONS = ["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"];

interface EventFormProps {
  categories: Category[];
  places: PlaceOption[];
  allImages: AdminImage[];
  mode: "create" | "edit";
  event?: Event;
  permissions?: EventPermissions;
}

/** ISO (UTC) -> valor local para <input type="datetime-local">. */
function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({
  categories,
  places,
  allImages,
  mode,
  event,
  permissions,
}: EventFormProps) {
  const router = useRouter();
  const readOnly = mode === "edit" && permissions !== undefined && !permissions.canEdit;

  const [title, setTitle] = useState(event?.title ?? "");
  const [excerpt, setExcerpt] = useState(event?.excerpt ?? "");
  const [body, setBody] = useState(event?.body ?? "");
  const [categoryId, setCategoryId] = useState(event?.categoryId ?? categories[0]?.id ?? "");
  const [placeId, setPlaceId] = useState<string>(event?.placeId ?? "");
  const [venueName, setVenueName] = useState(event?.venueName ?? "");
  const [startsAt, setStartsAt] = useState(event ? toDatetimeLocalValue(event.startsAt) : "");
  const [endsAt, setEndsAt] = useState(event?.endsAt ? toDatetimeLocalValue(event.endsAt) : "");
  const [images, setImages] = useState<ContentImage[]>(event?.images ?? []);
  const [seoTitle, setSeoTitle] = useState(event?.seoTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(event?.metaDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(event?.canonicalUrl ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(event?.ogImageUrl ?? "");
  const [videos, setVideos] = useState<ContentVideoInput[]>(
    event?.videos.map((v) => ({
      url: `https://www.youtube.com/watch?v=${v.videoId}`,
      title: v.title,
      caption: v.caption,
    })) ?? [],
  );
  const [robots, setRobots] = useState(event?.robots ?? "index,follow");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

  function buildInput(): EventInput {
    return {
      title,
      excerpt: excerpt || null,
      body,
      categoryId,
      placeId: placeId || null,
      venueName: placeId ? null : venueName || null,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      images,
      seoTitle: seoTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      ogImageUrl: ogImageUrl || null,
      videos,
      robots,
    };
  }

  async function handleSubmit() {
    setPending(true);
    setError(null);
    const result =
      mode === "create" ? await createEventAction(buildInput()) : await updateEventAction(event!.id, buildInput());
    applyResult(result, "Cambios guardados.");
  }

  function applyResult(result: ActionResult, successMessage: string) {
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success(successMessage);
    router.refresh();
  }

  async function runWorkflow(action: () => Promise<ActionResult>, successMessage: string) {
    setPending(true);
    setError(null);
    const result = await action();
    applyResult(result, successMessage);
  }

  return (
    <div className="max-w-6xl space-y-6">
      {event && (
        <div className="flex flex-wrap items-center gap-3 rounded-card bg-surface px-4 py-3 text-sm shadow-card">
          <span className="font-medium text-foreground">Estado: {articleStatusLabel(event.status)}</span>
          {event.rejectionReason && <span className="text-muted">Motivo de rechazo: {event.rejectionReason}</span>}
        </div>
      )}

      {readOnly && (
        <p className="rounded-md border border-border bg-accent-soft px-4 py-3 text-sm text-accent">
          Este evento no se puede editar en su estado/rol actual. Puedes seguir viendo el contenido.
        </p>
      )}

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* Columna principal: lo que se escribe */}
        <div className="space-y-6">
          <Card title="Contenido">
            <Field label="Título" name="title">
              <TextInput type="text" value={title} disabled={readOnly} onChange={(e) => setTitle(e.target.value)} />
            </Field>

            <Field label="Descripción breve (opcional)" name="excerpt">
              <TextArea value={excerpt} disabled={readOnly} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
            </Field>

            <Field label="Descripción completa" name="body">
              <RichTextEditor value={body} onChange={setBody} disabled={readOnly} allImages={allImages} />
            </Field>
          </Card>

          <Card title="Lugar y horario">
            <Field label="Lugar (opcional, si ya existe en Lugares)" name="placeId">
              <Combobox
                options={places.map((place) => ({ id: place.id, label: place.name }))}
                value={placeId || null}
                disabled={readOnly}
                placeholder="Sin lugar (especificar nombre abajo)"
                onSelect={(id) => setPlaceId(id ?? "")}
              />
            </Field>

            {!placeId && (
              <Field label="Nombre del lugar (opcional, texto libre)" name="venueName">
                <TextInput
                  type="text"
                  value={venueName}
                  disabled={readOnly}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="Ej. Plaza Mayor de Huamanga"
                />
              </Field>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Fecha y hora de inicio" name="startsAt">
                <DateTimeInput
                 
                  value={startsAt}
                  disabled={readOnly}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </Field>
              <Field label="Fecha y hora de fin (opcional)" name="endsAt">
                <DateTimeInput
                 
                  value={endsAt}
                  disabled={readOnly}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </Field>
            </div>
          </Card>

          <CollapsibleCard title="SEO">
            <Field label="Título SEO (opcional, si no se define usa el título)" name="seoTitle">
              <TextInput type="text" value={seoTitle} disabled={readOnly} onChange={(e) => setSeoTitle(e.target.value)} />
            </Field>
            <Field label="Meta descripción (opcional)" name="metaDescription">
              <TextArea value={metaDescription} disabled={readOnly} onChange={(e) => setMetaDescription(e.target.value)} rows={2} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="URL canónica (opcional)" name="canonicalUrl">
                <TextInput type="text" value={canonicalUrl} disabled={readOnly} onChange={(e) => setCanonicalUrl(e.target.value)} />
              </Field>
              <Field label="Imagen para Open Graph (URL, opcional)" name="ogImageUrl">
                <TextInput type="text" value={ogImageUrl} disabled={readOnly} onChange={(e) => setOgImageUrl(e.target.value)} />
              </Field>
            </div>
            <Field label="Robots" name="robots">
              <Combobox
                options={ROBOTS_OPTIONS.map((option) => ({ id: option, label: option }))}
                value={robots}
                disabled={readOnly}
                onSelect={(id) => id && setRobots(id)}
              />
            </Field>
          </CollapsibleCard>
        </div>

        {/* Barra lateral: publicar + metadata — visible sin scrollear todo el formulario */}
        <div className="space-y-6">
          <Card title="Publicar">
            {error && <FormError message={error} />}
            {!readOnly && (
              <Button type="submit" disabled={pending || !title || !body || !categoryId || !startsAt} onClick={handleSubmit} className="w-full">
                {pending ? "Guardando…" : mode === "create" ? "Crear borrador" : "Guardar cambios"}
              </Button>
            )}

            {mode === "edit" && event && permissions && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex flex-wrap gap-2">
                  {permissions.canSubmit && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => submitEventAction(event.id), "Enviado a revisión.")}
                    >
                      Enviar a revisión
                    </Button>
                  )}
                  {permissions.canApprove && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => approveEventAction(event.id), "Evento aprobado.")}
                    >
                      Aprobar
                    </Button>
                  )}
                  {permissions.canPublish && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => publishEventAction(event.id), "Evento publicado.")}
                    >
                      Publicar ahora
                    </Button>
                  )}
                  {permissions.canArchive && (
                    <ArchiveButton
                      itemLabel="este evento"
                      disabled={pending}
                      onConfirm={() => runWorkflow(() => archiveEventAction(event.id), "Evento archivado.")}
                    />
                  )}
                </div>

                {permissions.canReject && (
                  <div className="space-y-2">
                    <Field label="Motivo de rechazo" name="rejectReason">
                      <TextInput type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                    </Field>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending || !rejectReason.trim()}
                      onClick={() => runWorkflow(() => rejectEventAction(event.id, rejectReason), "Evento rechazado.")}
                      className="w-full"
                    >
                      Rechazar
                    </Button>
                  </div>
                )}

                {permissions.canSchedule && (
                  <div className="space-y-2">
                    <Field label="Programar publicación para" name="scheduleAt">
                      <DateTimeInput value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
                    </Field>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending || !scheduleAt}
                      onClick={() =>
                        runWorkflow(() => scheduleEventAction(event.id, new Date(scheduleAt).toISOString()), "Publicación programada.")
                      }
                      className="w-full"
                    >
                      Programar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card title="Organización">
            <Field label="Tema" name="categoryId">
              <Combobox
                options={categories.map((category) => ({ id: category.id, label: category.name }))}
                value={categoryId}
                disabled={readOnly}
                onSelect={(id) => id && setCategoryId(id)}
              />
            </Field>
          </Card>

          <Card title="Fotos y videos">
            <Field label="Fotografías (opcional — la primera es la portada de tarjeta/feed)" name="images">
              <ContentImagesPicker allImages={allImages} value={images} onChange={setImages} disabled={readOnly} />
            </Field>

            <Field label="Videos de YouTube (opcional)" name="videos">
              <VideoLinksEditor value={videos} onChange={setVideos} disabled={readOnly} />
            </Field>
          </Card>
        </div>
      </div>
    </div>
  );
}

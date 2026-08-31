"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminImage, EventInput } from "@/lib/api/admin-types";
import type { Category, Event, GeographicUnit, Place } from "@/lib/api/types";
import type { EventPermissions } from "@/lib/admin/event-permissions";
import { articleStatusLabel } from "@/lib/content-labels";
import { AdminButton, FormField, formInputClass } from "@/components/admin/ui";
import { GeographyPicker } from "./geography-picker";
import { PlaceGalleryPicker } from "./place-gallery-picker";
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
  places: Place[];
  allImages: AdminImage[];
  initialGeographyChain: GeographicUnit[];
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
  initialGeographyChain,
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
  const [geographyId, setGeographyId] = useState<string | null>(event?.geographyId ?? null);
  const [placeId, setPlaceId] = useState<string>(event?.placeId ?? "");
  const [venueName, setVenueName] = useState(event?.venueName ?? "");
  const [startsAt, setStartsAt] = useState(event ? toDatetimeLocalValue(event.startsAt) : "");
  const [endsAt, setEndsAt] = useState(event?.endsAt ? toDatetimeLocalValue(event.endsAt) : "");
  const [imageIds, setImageIds] = useState<string[]>(event?.imageIds ?? []);
  const [seoTitle, setSeoTitle] = useState(event?.seoTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(event?.metaDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(event?.canonicalUrl ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(event?.ogImageUrl ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [removeYoutube, setRemoveYoutube] = useState(false);
  const [robots, setRobots] = useState(event?.robots ?? "index,follow");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

  function buildInput(): EventInput {
    return {
      title,
      excerpt: excerpt || null,
      body,
      categoryId,
      geographyId,
      placeId: placeId || null,
      venueName: placeId ? null : venueName || null,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      imageIds,
      seoTitle: seoTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      ogImageUrl: ogImageUrl || null,
      youtubeUrl: resolveYoutubeUrlForSubmit(),
      robots,
    };
  }

  /** Mismo motivo que PlaceForm: el backend reemplaza youtubeVideoId con lo que se mande, vacío incluido. */
  function resolveYoutubeUrlForSubmit(): string | null {
    if (youtubeUrl.trim()) return youtubeUrl;
    if (removeYoutube) return null;
    if (event?.youtubeVideoId) return `https://www.youtube.com/watch?v=${event.youtubeVideoId}`;
    return null;
  }

  async function handleSubmit() {
    setPending(true);
    setError(null);
    setNotice(null);
    const result =
      mode === "create" ? await createEventAction(buildInput()) : await updateEventAction(event!.id, buildInput());
    applyResult(result, "Cambios guardados.");
  }

  function applyResult(result: ActionResult, successMessage: string) {
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotice(successMessage);
    router.refresh();
  }

  async function runWorkflow(action: () => Promise<ActionResult>, successMessage: string) {
    setPending(true);
    setError(null);
    setNotice(null);
    const result = await action();
    applyResult(result, successMessage);
  }

  return (
    <div className="max-w-3xl space-y-8">
      {event && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
          <span className="font-medium text-foreground">Estado: {articleStatusLabel(event.status)}</span>
          {event.rejectionReason && <span className="text-muted">Motivo de rechazo: {event.rejectionReason}</span>}
        </div>
      )}

      {readOnly && (
        <p className="rounded-md border border-border bg-accent-soft px-4 py-3 text-sm text-accent">
          Este evento no se puede editar en su estado/rol actual. Puedes seguir viendo el contenido.
        </p>
      )}

      <div className="space-y-4">
        <FormField label="Título" name="title">
          <input type="text" value={title} disabled={readOnly} onChange={(e) => setTitle(e.target.value)} className={formInputClass} />
        </FormField>

        <FormField label="Descripción breve (opcional)" name="excerpt">
          <textarea value={excerpt} disabled={readOnly} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={formInputClass} />
        </FormField>

        <FormField label="Descripción completa" name="body">
          <textarea value={body} disabled={readOnly} onChange={(e) => setBody(e.target.value)} rows={14} className={formInputClass} />
        </FormField>

        <FormField label="Categoría" name="categoryId">
          <select value={categoryId} disabled={readOnly} onChange={(e) => setCategoryId(e.target.value)} className={formInputClass}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Ubicación geográfica (opcional)" name="geographyId">
          <GeographyPicker initialChain={initialGeographyChain} onChange={setGeographyId} />
        </FormField>

        <FormField label="Lugar (opcional, si ya existe en Lugares)" name="placeId">
          <select
            value={placeId}
            disabled={readOnly}
            onChange={(e) => setPlaceId(e.target.value)}
            className={formInputClass}
          >
            <option value="">Sin lugar (especificar nombre abajo)</option>
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
        </FormField>

        {!placeId && (
          <FormField label="Nombre del lugar (opcional, texto libre)" name="venueName">
            <input
              type="text"
              value={venueName}
              disabled={readOnly}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="Ej. Plaza Mayor de Huamanga"
              className={formInputClass}
            />
          </FormField>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Fecha y hora de inicio" name="startsAt">
            <input
              type="datetime-local"
              value={startsAt}
              disabled={readOnly}
              onChange={(e) => setStartsAt(e.target.value)}
              className={formInputClass}
            />
          </FormField>
          <FormField label="Fecha y hora de fin (opcional)" name="endsAt">
            <input
              type="datetime-local"
              value={endsAt}
              disabled={readOnly}
              onChange={(e) => setEndsAt(e.target.value)}
              className={formInputClass}
            />
          </FormField>
        </div>

        <FormField label="Fotografías" name="imageIds">
          <PlaceGalleryPicker allImages={allImages} value={imageIds} onChange={setImageIds} disabled={readOnly} />
        </FormField>

        <FormField label="Video de YouTube (URL, opcional)" name="youtubeUrl">
          <input
            type="text"
            value={youtubeUrl}
            disabled={readOnly || removeYoutube}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder={event?.youtubeVideoId ? "Ya tiene un video — pega otra URL para reemplazarlo" : "https://www.youtube.com/watch?v=…"}
            className={formInputClass}
          />
        </FormField>
        {event?.youtubeVideoId && (
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={removeYoutube} disabled={readOnly} onChange={(e) => setRemoveYoutube(e.target.checked)} />
            Quitar el video actual
          </label>
        )}
      </div>

      <fieldset className="space-y-4 border-t border-border pt-6">
        <legend className="text-sm font-medium text-foreground">SEO</legend>
        <FormField label="Título SEO (opcional, si no se define usa el título)" name="seoTitle">
          <input type="text" value={seoTitle} disabled={readOnly} onChange={(e) => setSeoTitle(e.target.value)} className={formInputClass} />
        </FormField>
        <FormField label="Meta descripción (opcional)" name="metaDescription">
          <textarea value={metaDescription} disabled={readOnly} onChange={(e) => setMetaDescription(e.target.value)} rows={2} className={formInputClass} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="URL canónica (opcional)" name="canonicalUrl">
            <input type="text" value={canonicalUrl} disabled={readOnly} onChange={(e) => setCanonicalUrl(e.target.value)} className={formInputClass} />
          </FormField>
          <FormField label="Imagen para Open Graph (URL, opcional)" name="ogImageUrl">
            <input type="text" value={ogImageUrl} disabled={readOnly} onChange={(e) => setOgImageUrl(e.target.value)} className={formInputClass} />
          </FormField>
        </div>
        <FormField label="Robots" name="robots">
          <select value={robots} disabled={readOnly} onChange={(e) => setRobots(e.target.value)} className={formInputClass}>
            {ROBOTS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </FormField>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {notice && <p className="text-sm text-accent">{notice}</p>}

      {!readOnly && (
        <AdminButton
          disabled={pending || !title || !body || !categoryId || !startsAt}
          onClick={handleSubmit}
        >
          {pending ? "Guardando…" : mode === "create" ? "Crear borrador" : "Guardar cambios"}
        </AdminButton>
      )}

      {mode === "edit" && event && permissions && (
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="text-sm font-medium text-foreground">Flujo de publicación</h2>
          <div className="flex flex-wrap gap-2">
            {permissions.canSubmit && (
              <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => runWorkflow(() => submitEventAction(event.id), "Enviado a revisión.")}>
                Enviar a revisión
              </AdminButton>
            )}
            {permissions.canApprove && (
              <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => runWorkflow(() => approveEventAction(event.id), "Evento aprobado.")}>
                Aprobar
              </AdminButton>
            )}
            {permissions.canPublish && (
              <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => runWorkflow(() => publishEventAction(event.id), "Evento publicado.")}>
                Publicar ahora
              </AdminButton>
            )}
            {permissions.canArchive && (
              <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => runWorkflow(() => archiveEventAction(event.id), "Evento archivado.")}>
                Archivar
              </AdminButton>
            )}
          </div>

          {permissions.canReject && (
            <div className="flex flex-wrap items-end gap-2">
              <FormField label="Motivo de rechazo" name="rejectReason">
                <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className={formInputClass} />
              </FormField>
              <AdminButton
                type="button"
                variant="secondary"
                disabled={pending || !rejectReason.trim()}
                onClick={() => runWorkflow(() => rejectEventAction(event.id, rejectReason), "Evento rechazado.")}
              >
                Rechazar
              </AdminButton>
            </div>
          )}

          {permissions.canSchedule && (
            <div className="flex flex-wrap items-end gap-2">
              <FormField label="Programar publicación para" name="scheduleAt">
                <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className={formInputClass} />
              </FormField>
              <AdminButton
                type="button"
                variant="secondary"
                disabled={pending || !scheduleAt}
                onClick={() =>
                  runWorkflow(() => scheduleEventAction(event.id, new Date(scheduleAt).toISOString()), "Publicación programada.")
                }
              >
                Programar
              </AdminButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


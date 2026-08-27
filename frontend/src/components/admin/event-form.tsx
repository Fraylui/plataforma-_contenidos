"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { AdminImage, EventInput } from "@/lib/api/admin-types";
import type { Category, Event, GeographicUnit, Place } from "@/lib/api/types";
import type { EventPermissions } from "@/lib/admin/event-permissions";
import { articleStatusLabel } from "@/lib/content-labels";
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
        <Field label="Título">
          <input type="text" value={title} disabled={readOnly} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>

        <Field label="Descripción breve (opcional)">
          <textarea value={excerpt} disabled={readOnly} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={inputClass} />
        </Field>

        <Field label="Descripción completa">
          <textarea value={body} disabled={readOnly} onChange={(e) => setBody(e.target.value)} rows={14} className={inputClass} />
        </Field>

        <Field label="Categoría">
          <select value={categoryId} disabled={readOnly} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Ubicación geográfica (opcional)">
          <GeographyPicker initialChain={initialGeographyChain} onChange={setGeographyId} />
        </Field>

        <Field label="Lugar (opcional, si ya existe en Lugares)">
          <select
            value={placeId}
            disabled={readOnly}
            onChange={(e) => setPlaceId(e.target.value)}
            className={inputClass}
          >
            <option value="">Sin lugar (especificar nombre abajo)</option>
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
        </Field>

        {!placeId && (
          <Field label="Nombre del lugar (opcional, texto libre)">
            <input
              type="text"
              value={venueName}
              disabled={readOnly}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="Ej. Plaza Mayor de Huamanga"
              className={inputClass}
            />
          </Field>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Fecha y hora de inicio">
            <input
              type="datetime-local"
              value={startsAt}
              disabled={readOnly}
              onChange={(e) => setStartsAt(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Fecha y hora de fin (opcional)">
            <input
              type="datetime-local"
              value={endsAt}
              disabled={readOnly}
              onChange={(e) => setEndsAt(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Fotografías">
          <PlaceGalleryPicker allImages={allImages} value={imageIds} onChange={setImageIds} disabled={readOnly} />
        </Field>

        <Field label="Video de YouTube (URL, opcional)">
          <input
            type="text"
            value={youtubeUrl}
            disabled={readOnly || removeYoutube}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder={event?.youtubeVideoId ? "Ya tiene un video — pega otra URL para reemplazarlo" : "https://www.youtube.com/watch?v=…"}
            className={inputClass}
          />
        </Field>
        {event?.youtubeVideoId && (
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={removeYoutube} disabled={readOnly} onChange={(e) => setRemoveYoutube(e.target.checked)} />
            Quitar el video actual
          </label>
        )}
      </div>

      <fieldset className="space-y-4 border-t border-border pt-6">
        <legend className="text-sm font-medium text-foreground">SEO</legend>
        <Field label="Título SEO (opcional, si no se define usa el título)">
          <input type="text" value={seoTitle} disabled={readOnly} onChange={(e) => setSeoTitle(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Meta descripción (opcional)">
          <textarea value={metaDescription} disabled={readOnly} onChange={(e) => setMetaDescription(e.target.value)} rows={2} className={inputClass} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="URL canónica (opcional)">
            <input type="text" value={canonicalUrl} disabled={readOnly} onChange={(e) => setCanonicalUrl(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Imagen para Open Graph (URL, opcional)">
            <input type="text" value={ogImageUrl} disabled={readOnly} onChange={(e) => setOgImageUrl(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="Robots">
          <select value={robots} disabled={readOnly} onChange={(e) => setRobots(e.target.value)} className={inputClass}>
            {ROBOTS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {notice && <p className="text-sm text-accent">{notice}</p>}

      {!readOnly && (
        <button
          type="button"
          disabled={pending || !title || !body || !categoryId || !startsAt}
          onClick={handleSubmit}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Guardando…" : mode === "create" ? "Crear borrador" : "Guardar cambios"}
        </button>
      )}

      {mode === "edit" && event && permissions && (
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="text-sm font-medium text-foreground">Flujo editorial</h2>
          <div className="flex flex-wrap gap-2">
            {permissions.canSubmit && (
              <WorkflowButton pending={pending} onClick={() => runWorkflow(() => submitEventAction(event.id), "Enviado a revisión.")}>
                Enviar a revisión
              </WorkflowButton>
            )}
            {permissions.canApprove && (
              <WorkflowButton pending={pending} onClick={() => runWorkflow(() => approveEventAction(event.id), "Evento aprobado.")}>
                Aprobar
              </WorkflowButton>
            )}
            {permissions.canPublish && (
              <WorkflowButton pending={pending} onClick={() => runWorkflow(() => publishEventAction(event.id), "Evento publicado.")}>
                Publicar ahora
              </WorkflowButton>
            )}
            {permissions.canArchive && (
              <WorkflowButton pending={pending} onClick={() => runWorkflow(() => archiveEventAction(event.id), "Evento archivado.")}>
                Archivar
              </WorkflowButton>
            )}
          </div>

          {permissions.canReject && (
            <div className="flex flex-wrap items-end gap-2">
              <Field label="Motivo de rechazo">
                <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className={inputClass} />
              </Field>
              <WorkflowButton
                pending={pending}
                disabled={!rejectReason.trim()}
                onClick={() => runWorkflow(() => rejectEventAction(event.id, rejectReason), "Evento rechazado.")}
              >
                Rechazar
              </WorkflowButton>
            </div>
          )}

          {permissions.canSchedule && (
            <div className="flex flex-wrap items-end gap-2">
              <Field label="Programar publicación para">
                <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className={inputClass} />
              </Field>
              <WorkflowButton
                pending={pending}
                disabled={!scheduleAt}
                onClick={() =>
                  runWorkflow(() => scheduleEventAction(event.id, new Date(scheduleAt).toISOString()), "Publicación programada.")
                }
              >
                Programar
              </WorkflowButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent disabled:opacity-60";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      {children}
    </label>
  );
}

function WorkflowButton({
  children,
  onClick,
  pending,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  pending: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={pending || disabled}
      onClick={onClick}
      className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent-soft hover:text-accent disabled:opacity-50"
    >
      {children}
    </button>
  );
}

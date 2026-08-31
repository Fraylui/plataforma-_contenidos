"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminImage } from "@/lib/api/admin-types";
import type { Category, GeographicUnit, Place } from "@/lib/api/types";
import type { PlaceInput } from "@/lib/api/admin-types";
import type { PlacePermissions } from "@/lib/admin/place-permissions";
import { articleStatusLabel } from "@/lib/content-labels";
import { AdminButton, FormField, formInputClass } from "@/components/admin/ui";
import { GeographyPicker } from "./geography-picker";
import { PlaceGalleryPicker } from "./place-gallery-picker";
import {
  approvePlaceAction,
  archivePlaceAction,
  createPlaceAction,
  publishPlaceAction,
  rejectPlaceAction,
  schedulePlaceAction,
  submitPlaceAction,
  updatePlaceAction,
  type ActionResult,
} from "@/app/admin/(protected)/lugares/actions";

const ROBOTS_OPTIONS = ["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"];

interface PlaceFormProps {
  categories: Category[];
  allImages: AdminImage[];
  initialGeographyChain: GeographicUnit[];
  mode: "create" | "edit";
  place?: Place;
  permissions?: PlacePermissions;
}

export function PlaceForm({ categories, allImages, initialGeographyChain, mode, place, permissions }: PlaceFormProps) {
  const router = useRouter();
  const readOnly = mode === "edit" && permissions !== undefined && !permissions.canEdit;

  const [name, setName] = useState(place?.name ?? "");
  const [excerpt, setExcerpt] = useState(place?.excerpt ?? "");
  const [body, setBody] = useState(place?.body ?? "");
  const [categoryId, setCategoryId] = useState(place?.categoryId ?? categories[0]?.id ?? "");
  const [geographyId, setGeographyId] = useState<string | null>(place?.geographyId ?? null);
  const [latitude, setLatitude] = useState(place?.latitude != null ? String(place.latitude) : "");
  const [longitude, setLongitude] = useState(place?.longitude != null ? String(place.longitude) : "");
  const [imageIds, setImageIds] = useState<string[]>(place?.imageIds ?? []);
  const [seoTitle, setSeoTitle] = useState(place?.seoTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(place?.metaDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(place?.canonicalUrl ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(place?.ogImageUrl ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [removeYoutube, setRemoveYoutube] = useState(false);
  const [robots, setRobots] = useState(place?.robots ?? "index,follow");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

  function buildInput(): PlaceInput {
    return {
      name,
      excerpt: excerpt || null,
      body,
      categoryId,
      geographyId,
      latitude: latitude.trim() ? Number(latitude) : null,
      longitude: longitude.trim() ? Number(longitude) : null,
      imageIds,
      seoTitle: seoTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      ogImageUrl: ogImageUrl || null,
      youtubeUrl: resolveYoutubeUrlForSubmit(),
      robots,
    };
  }

  /** Mismo motivo que ArticleForm: el backend reemplaza youtubeVideoId con lo que se mande, vacío incluido. */
  function resolveYoutubeUrlForSubmit(): string | null {
    if (youtubeUrl.trim()) return youtubeUrl;
    if (removeYoutube) return null;
    if (place?.youtubeVideoId) return `https://www.youtube.com/watch?v=${place.youtubeVideoId}`;
    return null;
  }

  async function handleSubmit() {
    setPending(true);
    setError(null);
    setNotice(null);
    const result = mode === "create" ? await createPlaceAction(buildInput()) : await updatePlaceAction(place!.id, buildInput());
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
      {place && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
          <span className="font-medium text-foreground">Estado: {articleStatusLabel(place.status)}</span>
          {place.rejectionReason && <span className="text-muted">Motivo de rechazo: {place.rejectionReason}</span>}
        </div>
      )}

      {readOnly && (
        <p className="rounded-md border border-border bg-accent-soft px-4 py-3 text-sm text-accent">
          Este lugar no se puede editar en su estado/rol actual. Puedes seguir viendo el contenido.
        </p>
      )}

      <div className="space-y-4">
        <FormField label="Nombre" name="name">
          <input type="text" value={name} disabled={readOnly} onChange={(e) => setName(e.target.value)} className={formInputClass} />
        </FormField>

        <FormField label="Descripción breve (opcional)" name="excerpt">
          <textarea value={excerpt} disabled={readOnly} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={formInputClass} />
        </FormField>

        <FormField label="Historia / descripción completa" name="body">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Latitud (opcional)" name="latitude">
            <input
              type="number"
              step="any"
              min={-90}
              max={90}
              value={latitude}
              disabled={readOnly}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="-13.04"
              className={formInputClass}
            />
          </FormField>
          <FormField label="Longitud (opcional)" name="longitude">
            <input
              type="number"
              step="any"
              min={-180}
              max={180}
              value={longitude}
              disabled={readOnly}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="-74.15"
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
            placeholder={place?.youtubeVideoId ? "Ya tiene un video — pega otra URL para reemplazarlo" : "https://www.youtube.com/watch?v=…"}
            className={formInputClass}
          />
        </FormField>
        {place?.youtubeVideoId && (
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={removeYoutube} disabled={readOnly} onChange={(e) => setRemoveYoutube(e.target.checked)} />
            Quitar el video actual
          </label>
        )}
      </div>

      <fieldset className="space-y-4 border-t border-border pt-6">
        <legend className="text-sm font-medium text-foreground">SEO</legend>
        <FormField label="Título SEO (opcional, si no se define usa el nombre)" name="seoTitle">
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
          disabled={pending || !name || !body || !categoryId}
          onClick={handleSubmit}
        >
          {pending ? "Guardando…" : mode === "create" ? "Crear borrador" : "Guardar cambios"}
        </AdminButton>
      )}

      {mode === "edit" && place && permissions && (
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="text-sm font-medium text-foreground">Flujo de publicación</h2>
          <div className="flex flex-wrap gap-2">
            {permissions.canSubmit && (
              <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => runWorkflow(() => submitPlaceAction(place.id), "Enviado a revisión.")}>
                Enviar a revisión
              </AdminButton>
            )}
            {permissions.canApprove && (
              <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => runWorkflow(() => approvePlaceAction(place.id), "Lugar aprobado.")}>
                Aprobar
              </AdminButton>
            )}
            {permissions.canPublish && (
              <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => runWorkflow(() => publishPlaceAction(place.id), "Lugar publicado.")}>
                Publicar ahora
              </AdminButton>
            )}
            {permissions.canArchive && (
              <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => runWorkflow(() => archivePlaceAction(place.id), "Lugar archivado.")}>
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
                onClick={() => runWorkflow(() => rejectPlaceAction(place.id, rejectReason), "Lugar rechazado.")}
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
                  runWorkflow(() => schedulePlaceAction(place.id, new Date(scheduleAt).toISOString()), "Publicación programada.")
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


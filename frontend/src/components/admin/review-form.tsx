"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminImage, ReviewInput } from "@/lib/api/admin-types";
import type { Category, GeographicUnit, Place, Review } from "@/lib/api/types";
import type { ReviewPermissions } from "@/lib/admin/review-permissions";
import { articleStatusLabel } from "@/lib/content-labels";
import { AdminButton, FormField, formInputClass } from "@/components/admin/ui";
import { GeographyPicker } from "./geography-picker";
import { PlaceGalleryPicker } from "./place-gallery-picker";
import {
  approveReviewAction,
  archiveReviewAction,
  createReviewAction,
  publishReviewAction,
  rejectReviewAction,
  scheduleReviewAction,
  submitReviewAction,
  updateReviewAction,
  type ActionResult,
} from "@/app/admin/(protected)/resenas/actions";

const ROBOTS_OPTIONS = ["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"];

interface ReviewFormProps {
  categories: Category[];
  places: Place[];
  allImages: AdminImage[];
  initialGeographyChain: GeographicUnit[];
  mode: "create" | "edit";
  review?: Review;
  permissions?: ReviewPermissions;
}

export function ReviewForm({
  categories,
  places,
  allImages,
  initialGeographyChain,
  mode,
  review,
  permissions,
}: ReviewFormProps) {
  const router = useRouter();
  const readOnly = mode === "edit" && permissions !== undefined && !permissions.canEdit;

  const [title, setTitle] = useState(review?.title ?? "");
  const [excerpt, setExcerpt] = useState(review?.excerpt ?? "");
  const [body, setBody] = useState(review?.body ?? "");
  const [categoryId, setCategoryId] = useState(review?.categoryId ?? categories[0]?.id ?? "");
  const [geographyId, setGeographyId] = useState<string | null>(review?.geographyId ?? null);
  const [placeId, setPlaceId] = useState<string>(review?.placeId ?? "");
  const [subjectName, setSubjectName] = useState(review?.subjectName ?? "");
  const [rating, setRating] = useState(review?.rating ?? 5);
  const [imageIds, setImageIds] = useState<string[]>(review?.imageIds ?? []);
  const [seoTitle, setSeoTitle] = useState(review?.seoTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(review?.metaDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(review?.canonicalUrl ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(review?.ogImageUrl ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [removeYoutube, setRemoveYoutube] = useState(false);
  const [robots, setRobots] = useState(review?.robots ?? "index,follow");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

  function buildInput(): ReviewInput {
    return {
      title,
      excerpt: excerpt || null,
      body,
      categoryId,
      geographyId,
      placeId: placeId || null,
      subjectName: placeId ? null : subjectName || null,
      rating,
      imageIds,
      seoTitle: seoTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      ogImageUrl: ogImageUrl || null,
      youtubeUrl: resolveYoutubeUrlForSubmit(),
      robots,
    };
  }

  /** Mismo motivo que PlaceForm/EventForm: el backend reemplaza youtubeVideoId con lo que se mande, vacío incluido. */
  function resolveYoutubeUrlForSubmit(): string | null {
    if (youtubeUrl.trim()) return youtubeUrl;
    if (removeYoutube) return null;
    if (review?.youtubeVideoId) return `https://www.youtube.com/watch?v=${review.youtubeVideoId}`;
    return null;
  }

  async function handleSubmit() {
    setPending(true);
    setError(null);
    setNotice(null);
    const result =
      mode === "create" ? await createReviewAction(buildInput()) : await updateReviewAction(review!.id, buildInput());
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
      {review && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
          <span className="font-medium text-foreground">Estado: {articleStatusLabel(review.status)}</span>
          {review.rejectionReason && <span className="text-muted">Motivo de rechazo: {review.rejectionReason}</span>}
        </div>
      )}

      {readOnly && (
        <p className="rounded-md border border-border bg-accent-soft px-4 py-3 text-sm text-accent">
          Esta reseña no se puede editar en su estado/rol actual. Puedes seguir viendo el contenido.
        </p>
      )}

      <div className="space-y-4">
        <FormField label="Título" name="title">
          <input type="text" value={title} disabled={readOnly} onChange={(e) => setTitle(e.target.value)} className={formInputClass} />
        </FormField>

        <FormField label="Descripción breve (opcional)" name="excerpt">
          <textarea value={excerpt} disabled={readOnly} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={formInputClass} />
        </FormField>

        <FormField label="Reseña completa" name="body">
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

        <FormField label="Lugar reseñado (opcional, si ya existe en Lugares)" name="placeId">
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
          <FormField label="Nombre de lo reseñado (opcional, texto libre)" name="subjectName">
            <input
              type="text"
              value={subjectName}
              disabled={readOnly}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Ej. Restaurante Wamanripa"
              className={formInputClass}
            />
          </FormField>
        )}

        <FormField label="Calificación" name="rating">
          <div className="mt-1 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                disabled={readOnly}
                onClick={() => setRating(value)}
                aria-label={`Calificar con ${value} estrella${value === 1 ? "" : "s"}`}
                className="p-0.5 disabled:opacity-60"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill={value <= rating ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={value <= rating ? 0 : 1.5}
                  className={`h-6 w-6 ${value <= rating ? "text-accent" : "text-border"}`}
                >
                  <path
                    strokeLinejoin="round"
                    d="M10 1.5l2.59 5.25 5.79.84-4.19 4.08.99 5.77L10 14.77l-5.18 2.67.99-5.77-4.19-4.08 5.79-.84L10 1.5Z"
                  />
                </svg>
              </button>
            ))}
            <span className="ml-2 text-sm text-muted">{rating} / 5</span>
          </div>
        </FormField>

        <FormField label="Fotografías (opcional)" name="imageIds">
          <PlaceGalleryPicker allImages={allImages} value={imageIds} onChange={setImageIds} disabled={readOnly} />
        </FormField>

        <FormField label="Video de YouTube (URL, opcional)" name="youtubeUrl">
          <input
            type="text"
            value={youtubeUrl}
            disabled={readOnly || removeYoutube}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder={review?.youtubeVideoId ? "Ya tiene un video — pega otra URL para reemplazarlo" : "https://www.youtube.com/watch?v=…"}
            className={formInputClass}
          />
        </FormField>
        {review?.youtubeVideoId && (
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
          disabled={pending || !title || !body || !categoryId}
          onClick={handleSubmit}
        >
          {pending ? "Guardando…" : mode === "create" ? "Crear borrador" : "Guardar cambios"}
        </AdminButton>
      )}

      {mode === "edit" && review && permissions && (
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="text-sm font-medium text-foreground">Flujo de publicación</h2>
          <div className="flex flex-wrap gap-2">
            {permissions.canSubmit && (
              <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => runWorkflow(() => submitReviewAction(review.id), "Enviada a revisión.")}>
                Enviar a revisión
              </AdminButton>
            )}
            {permissions.canApprove && (
              <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => runWorkflow(() => approveReviewAction(review.id), "Reseña aprobada.")}>
                Aprobar
              </AdminButton>
            )}
            {permissions.canPublish && (
              <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => runWorkflow(() => publishReviewAction(review.id), "Reseña publicada.")}>
                Publicar ahora
              </AdminButton>
            )}
            {permissions.canArchive && (
              <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => runWorkflow(() => archiveReviewAction(review.id), "Reseña archivada.")}>
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
                onClick={() => runWorkflow(() => rejectReviewAction(review.id, rejectReason), "Reseña rechazada.")}
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
                  runWorkflow(() => scheduleReviewAction(review.id, new Date(scheduleAt).toISOString()), "Publicación programada.")
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


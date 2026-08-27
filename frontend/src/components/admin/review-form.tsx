"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { AdminImage, ReviewInput } from "@/lib/api/admin-types";
import type { Category, GeographicUnit, Place, Review } from "@/lib/api/types";
import type { ReviewPermissions } from "@/lib/admin/review-permissions";
import { articleStatusLabel } from "@/lib/content-labels";
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
        <Field label="Título">
          <input type="text" value={title} disabled={readOnly} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>

        <Field label="Descripción breve (opcional)">
          <textarea value={excerpt} disabled={readOnly} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={inputClass} />
        </Field>

        <Field label="Reseña completa">
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

        <Field label="Lugar reseñado (opcional, si ya existe en Lugares)">
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
          <Field label="Nombre de lo reseñado (opcional, texto libre)">
            <input
              type="text"
              value={subjectName}
              disabled={readOnly}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Ej. Restaurante Wamanripa"
              className={inputClass}
            />
          </Field>
        )}

        <Field label="Calificación">
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
        </Field>

        <Field label="Fotografías (opcional)">
          <PlaceGalleryPicker allImages={allImages} value={imageIds} onChange={setImageIds} disabled={readOnly} />
        </Field>

        <Field label="Video de YouTube (URL, opcional)">
          <input
            type="text"
            value={youtubeUrl}
            disabled={readOnly || removeYoutube}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder={review?.youtubeVideoId ? "Ya tiene un video — pega otra URL para reemplazarlo" : "https://www.youtube.com/watch?v=…"}
            className={inputClass}
          />
        </Field>
        {review?.youtubeVideoId && (
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
          disabled={pending || !title || !body || !categoryId}
          onClick={handleSubmit}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Guardando…" : mode === "create" ? "Crear borrador" : "Guardar cambios"}
        </button>
      )}

      {mode === "edit" && review && permissions && (
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="text-sm font-medium text-foreground">Flujo editorial</h2>
          <div className="flex flex-wrap gap-2">
            {permissions.canSubmit && (
              <WorkflowButton pending={pending} onClick={() => runWorkflow(() => submitReviewAction(review.id), "Enviada a revisión.")}>
                Enviar a revisión
              </WorkflowButton>
            )}
            {permissions.canApprove && (
              <WorkflowButton pending={pending} onClick={() => runWorkflow(() => approveReviewAction(review.id), "Reseña aprobada.")}>
                Aprobar
              </WorkflowButton>
            )}
            {permissions.canPublish && (
              <WorkflowButton pending={pending} onClick={() => runWorkflow(() => publishReviewAction(review.id), "Reseña publicada.")}>
                Publicar ahora
              </WorkflowButton>
            )}
            {permissions.canArchive && (
              <WorkflowButton pending={pending} onClick={() => runWorkflow(() => archiveReviewAction(review.id), "Reseña archivada.")}>
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
                onClick={() => runWorkflow(() => rejectReviewAction(review.id, rejectReason), "Reseña rechazada.")}
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
                  runWorkflow(() => scheduleReviewAction(review.id, new Date(scheduleAt).toISOString()), "Publicación programada.")
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

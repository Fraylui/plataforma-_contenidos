"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { AdminImage, ReviewInput } from "@/lib/api/admin-types";
import type { Category, Place, Review } from "@/lib/api/types";
import type { ReviewPermissions } from "@/lib/admin/review-permissions";
import { articleStatusLabel } from "@/lib/content-labels";
import { AdminButton, Combobox, FormField, formInputClass } from "@/components/admin/ui";
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

const CARD_CLASS = "rounded-xl border border-border/60 bg-surface p-5";
const SECTION_TITLE_CLASS = "text-sm font-semibold text-foreground";

/** Grupo con título — misma superficie que el resto del panel (border-border/60, sin shadow). */
function SectionCard({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`${CARD_CLASS} space-y-4 ${className}`}>
      <h2 className={SECTION_TITLE_CLASS}>{title}</h2>
      {children}
    </div>
  );
}

/** Colapsable, cerrado por defecto — para lo avanzado/opcional (SEO) que no debería competir con el contenido principal. */
function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={CARD_CLASS}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between"
      >
        <h2 className={SECTION_TITLE_CLASS}>{title}</h2>
        <ChevronDown className={`h-4 w-4 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && <div className="mt-4 space-y-4">{children}</div>}
    </div>
  );
}

interface ReviewFormProps {
  categories: Category[];
  places: Place[];
  allImages: AdminImage[];
  mode: "create" | "edit";
  review?: Review;
  permissions?: ReviewPermissions;
}

export function ReviewForm({
  categories,
  places,
  allImages,
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
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

  function buildInput(): ReviewInput {
    return {
      title,
      excerpt: excerpt || null,
      body,
      categoryId,
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
    const result =
      mode === "create" ? await createReviewAction(buildInput()) : await updateReviewAction(review!.id, buildInput());
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* Columna principal: lo que se escribe */}
        <div className="space-y-6">
          <SectionCard title="Contenido">
            <FormField label="Título" name="title">
              <input type="text" value={title} disabled={readOnly} onChange={(e) => setTitle(e.target.value)} className={formInputClass} />
            </FormField>

            <FormField label="Descripción breve (opcional)" name="excerpt">
              <textarea value={excerpt} disabled={readOnly} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={formInputClass} />
            </FormField>

            <FormField label="Reseña completa" name="body">
              <textarea value={body} disabled={readOnly} onChange={(e) => setBody(e.target.value)} rows={14} className={formInputClass} />
            </FormField>

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
          </SectionCard>

          <CollapsibleSection title="SEO">
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
              <Combobox
                options={ROBOTS_OPTIONS.map((option) => ({ id: option, label: option }))}
                value={robots}
                disabled={readOnly}
                onSelect={(id) => id && setRobots(id)}
              />
            </FormField>
          </CollapsibleSection>
        </div>

        {/* Barra lateral: publicar + metadata — visible sin scrollear todo el formulario */}
        <div className="space-y-6">
          <SectionCard title="Publicar">
            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            {!readOnly && (
              <AdminButton disabled={pending || !title || !body || !categoryId} onClick={handleSubmit} className="w-full">
                {pending ? "Guardando…" : mode === "create" ? "Crear borrador" : "Guardar cambios"}
              </AdminButton>
            )}

            {mode === "edit" && review && permissions && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex flex-wrap gap-2">
                  {permissions.canSubmit && (
                    <AdminButton
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => submitReviewAction(review.id), "Enviada a revisión.")}
                    >
                      Enviar a revisión
                    </AdminButton>
                  )}
                  {permissions.canApprove && (
                    <AdminButton
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => approveReviewAction(review.id), "Reseña aprobada.")}
                    >
                      Aprobar
                    </AdminButton>
                  )}
                  {permissions.canPublish && (
                    <AdminButton
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => publishReviewAction(review.id), "Reseña publicada.")}
                    >
                      Publicar ahora
                    </AdminButton>
                  )}
                  {permissions.canArchive && (
                    <AdminButton
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => archiveReviewAction(review.id), "Reseña archivada.")}
                    >
                      Archivar
                    </AdminButton>
                  )}
                </div>

                {permissions.canReject && (
                  <div className="space-y-2">
                    <FormField label="Motivo de rechazo" name="rejectReason">
                      <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className={formInputClass} />
                    </FormField>
                    <AdminButton
                      type="button"
                      variant="secondary"
                      disabled={pending || !rejectReason.trim()}
                      onClick={() => runWorkflow(() => rejectReviewAction(review.id, rejectReason), "Reseña rechazada.")}
                      className="w-full"
                    >
                      Rechazar
                    </AdminButton>
                  </div>
                )}

                {permissions.canSchedule && (
                  <div className="space-y-2">
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
                      className="w-full"
                    >
                      Programar
                    </AdminButton>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Organización">
            <FormField label="Categoría" name="categoryId">
              <Combobox
                options={categories.map((category) => ({ id: category.id, label: category.name }))}
                value={categoryId}
                disabled={readOnly}
                onSelect={(id) => id && setCategoryId(id)}
              />
            </FormField>

            <FormField label="Lugar reseñado (opcional, si ya existe en Lugares)" name="placeId">
              <Combobox
                options={places.map((place) => ({ id: place.id, label: place.name }))}
                value={placeId || null}
                disabled={readOnly}
                placeholder="Sin lugar (especificar nombre abajo)"
                onSelect={(id) => setPlaceId(id ?? "")}
              />
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
          </SectionCard>

          <SectionCard title="Medios">
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
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

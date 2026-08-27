"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { AdminImage, GalleryInput } from "@/lib/api/admin-types";
import type { Category, Gallery, GeographicUnit } from "@/lib/api/types";
import type { GalleryPermissions } from "@/lib/admin/gallery-permissions";
import { articleStatusLabel } from "@/lib/content-labels";
import { GeographyPicker } from "./geography-picker";
import { PlaceGalleryPicker } from "./place-gallery-picker";
import {
  approveGalleryAction,
  archiveGalleryAction,
  createGalleryAction,
  publishGalleryAction,
  rejectGalleryAction,
  scheduleGalleryAction,
  submitGalleryAction,
  updateGalleryAction,
  type ActionResult,
} from "@/app/admin/(protected)/galerias/actions";

const ROBOTS_OPTIONS = ["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"];

interface GalleryFormProps {
  categories: Category[];
  allImages: AdminImage[];
  initialGeographyChain: GeographicUnit[];
  mode: "create" | "edit";
  gallery?: Gallery;
  permissions?: GalleryPermissions;
}

export function GalleryForm({
  categories,
  allImages,
  initialGeographyChain,
  mode,
  gallery,
  permissions,
}: GalleryFormProps) {
  const router = useRouter();
  const readOnly = mode === "edit" && permissions !== undefined && !permissions.canEdit;

  const [title, setTitle] = useState(gallery?.title ?? "");
  const [excerpt, setExcerpt] = useState(gallery?.excerpt ?? "");
  const [categoryId, setCategoryId] = useState(gallery?.categoryId ?? categories[0]?.id ?? "");
  const [geographyId, setGeographyId] = useState<string | null>(gallery?.geographyId ?? null);
  const [imageIds, setImageIds] = useState<string[]>(gallery?.imageIds ?? []);
  const [seoTitle, setSeoTitle] = useState(gallery?.seoTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(gallery?.metaDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(gallery?.canonicalUrl ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(gallery?.ogImageUrl ?? "");
  const [robots, setRobots] = useState(gallery?.robots ?? "index,follow");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

  function buildInput(): GalleryInput {
    return {
      title,
      excerpt: excerpt || null,
      categoryId,
      geographyId,
      imageIds,
      seoTitle: seoTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      ogImageUrl: ogImageUrl || null,
      robots,
    };
  }

  async function handleSubmit() {
    setPending(true);
    setError(null);
    setNotice(null);
    const result =
      mode === "create" ? await createGalleryAction(buildInput()) : await updateGalleryAction(gallery!.id, buildInput());
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
      {gallery && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
          <span className="font-medium text-foreground">Estado: {articleStatusLabel(gallery.status)}</span>
          {gallery.rejectionReason && <span className="text-muted">Motivo de rechazo: {gallery.rejectionReason}</span>}
        </div>
      )}

      {readOnly && (
        <p className="rounded-md border border-border bg-accent-soft px-4 py-3 text-sm text-accent">
          Esta galería no se puede editar en su estado/rol actual. Puedes seguir viendo el contenido.
        </p>
      )}

      <div className="space-y-4">
        <Field label="Título">
          <input type="text" value={title} disabled={readOnly} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>

        <Field label="Descripción breve (opcional)">
          <textarea value={excerpt} disabled={readOnly} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={inputClass} />
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

        <Field label="Fotografías (al menos una)">
          <PlaceGalleryPicker allImages={allImages} value={imageIds} onChange={setImageIds} disabled={readOnly} />
        </Field>
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
          disabled={pending || !title || !categoryId || imageIds.length === 0}
          onClick={handleSubmit}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Guardando…" : mode === "create" ? "Crear borrador" : "Guardar cambios"}
        </button>
      )}

      {mode === "edit" && gallery && permissions && (
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="text-sm font-medium text-foreground">Flujo editorial</h2>
          <div className="flex flex-wrap gap-2">
            {permissions.canSubmit && (
              <WorkflowButton pending={pending} onClick={() => runWorkflow(() => submitGalleryAction(gallery.id), "Enviada a revisión.")}>
                Enviar a revisión
              </WorkflowButton>
            )}
            {permissions.canApprove && (
              <WorkflowButton pending={pending} onClick={() => runWorkflow(() => approveGalleryAction(gallery.id), "Galería aprobada.")}>
                Aprobar
              </WorkflowButton>
            )}
            {permissions.canPublish && (
              <WorkflowButton pending={pending} onClick={() => runWorkflow(() => publishGalleryAction(gallery.id), "Galería publicada.")}>
                Publicar ahora
              </WorkflowButton>
            )}
            {permissions.canArchive && (
              <WorkflowButton pending={pending} onClick={() => runWorkflow(() => archiveGalleryAction(gallery.id), "Galería archivada.")}>
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
                onClick={() => runWorkflow(() => rejectGalleryAction(gallery.id, rejectReason), "Galería rechazada.")}
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
                  runWorkflow(() => scheduleGalleryAction(gallery.id, new Date(scheduleAt).toISOString()), "Publicación programada.")
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

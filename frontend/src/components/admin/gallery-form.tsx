"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import type { AdminImage, GalleryInput } from "@/lib/api/admin-types";
import type { Category, Gallery } from "@/lib/api/types";
import type { GalleryPermissions } from "@/lib/admin/gallery-permissions";
import { articleStatusLabel } from "@/lib/content-labels";
import { AdminButton, CollapsibleSection, Combobox, FormField, SectionCard, formInputClass } from "@/components/admin/ui";
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
  mode: "create" | "edit";
  gallery?: Gallery;
  permissions?: GalleryPermissions;
}

export function GalleryForm({
  categories,
  allImages,
  mode,
  gallery,
  permissions,
}: GalleryFormProps) {
  const router = useRouter();
  const readOnly = mode === "edit" && permissions !== undefined && !permissions.canEdit;

  const [title, setTitle] = useState(gallery?.title ?? "");
  const [excerpt, setExcerpt] = useState(gallery?.excerpt ?? "");
  const [categoryId, setCategoryId] = useState(gallery?.categoryId ?? categories[0]?.id ?? "");
  const [imageIds, setImageIds] = useState<string[]>(gallery?.imageIds ?? []);
  const [seoTitle, setSeoTitle] = useState(gallery?.seoTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(gallery?.metaDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(gallery?.canonicalUrl ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(gallery?.ogImageUrl ?? "");
  const [robots, setRobots] = useState(gallery?.robots ?? "index,follow");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

  function buildInput(): GalleryInput {
    return {
      title,
      excerpt: excerpt || null,
      categoryId,
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
    const result =
      mode === "create" ? await createGalleryAction(buildInput()) : await updateGalleryAction(gallery!.id, buildInput());
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

            <FormField label="Fotografías (al menos una)" name="imageIds">
              <PlaceGalleryPicker allImages={allImages} value={imageIds} onChange={setImageIds} disabled={readOnly} />
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
              <AdminButton disabled={pending || !title || !categoryId || imageIds.length === 0} onClick={handleSubmit} className="w-full">
                {pending ? "Guardando…" : mode === "create" ? "Crear borrador" : "Guardar cambios"}
              </AdminButton>
            )}

            {mode === "edit" && gallery && permissions && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex flex-wrap gap-2">
                  {permissions.canSubmit && (
                    <AdminButton
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => submitGalleryAction(gallery.id), "Enviada a revisión.")}
                    >
                      Enviar a revisión
                    </AdminButton>
                  )}
                  {permissions.canApprove && (
                    <AdminButton
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => approveGalleryAction(gallery.id), "Galería aprobada.")}
                    >
                      Aprobar
                    </AdminButton>
                  )}
                  {permissions.canPublish && (
                    <AdminButton
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => publishGalleryAction(gallery.id), "Galería publicada.")}
                    >
                      Publicar ahora
                    </AdminButton>
                  )}
                  {permissions.canArchive && (
                    <AdminButton
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => archiveGalleryAction(gallery.id), "Galería archivada.")}
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
                      onClick={() => runWorkflow(() => rejectGalleryAction(gallery.id, rejectReason), "Galería rechazada.")}
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
                        runWorkflow(() => scheduleGalleryAction(gallery.id, new Date(scheduleAt).toISOString()), "Publicación programada.")
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
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import type { AdminImage, GalleryInput } from "@/lib/api/admin-types";
import type { Category, ContentImage, Gallery } from "@/lib/api/types";
import type { GalleryPermissions } from "@/lib/admin/gallery-permissions";
import { articleStatusLabel } from "@/lib/content-labels";
import { ArchiveButton, FormError } from "@/components/admin/ui";
import { Button, Card, CollapsibleCard, Combobox, DateTimeInput, Field, TextArea, TextInput } from "@/components/ui";
import { ContentImagesPicker } from "./content-images-picker";
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
  const [images, setImages] = useState<ContentImage[]>(gallery?.images ?? []);
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
      images,
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
        <div className="flex flex-wrap items-center gap-3 rounded-card bg-surface px-4 py-3 text-sm shadow-card">
          <span className="font-medium text-foreground">Estado: {articleStatusLabel(gallery.status)}</span>
          {gallery.rejectionReason && <span className="text-muted">Motivo de rechazo: {gallery.rejectionReason}</span>}
        </div>
      )}

      {readOnly && (
        <p className="rounded-md border border-border bg-accent-soft px-4 py-3 text-sm text-accent">
          Esta galería no se puede editar en su estado/rol actual. Puedes seguir viendo el contenido.
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

            <Field label="Fotografías (al menos una)" name="images">
              <ContentImagesPicker allImages={allImages} value={images} onChange={setImages} disabled={readOnly} />
            </Field>
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
              <Button type="submit" disabled={pending || !title || !categoryId || images.length === 0} onClick={handleSubmit} className="w-full">
                {pending ? "Guardando…" : mode === "create" ? "Crear borrador" : "Guardar cambios"}
              </Button>
            )}

            {mode === "edit" && gallery && permissions && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex flex-wrap gap-2">
                  {permissions.canSubmit && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => submitGalleryAction(gallery.id), "Enviada a revisión.")}
                    >
                      Enviar a revisión
                    </Button>
                  )}
                  {permissions.canApprove && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => approveGalleryAction(gallery.id), "Galería aprobada.")}
                    >
                      Aprobar
                    </Button>
                  )}
                  {permissions.canPublish && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => publishGalleryAction(gallery.id), "Galería publicada.")}
                    >
                      Publicar ahora
                    </Button>
                  )}
                  {permissions.canArchive && (
                    <ArchiveButton
                      itemLabel="esta galería"
                      disabled={pending}
                      onConfirm={() => runWorkflow(() => archiveGalleryAction(gallery.id), "Galería archivada.")}
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
                      onClick={() => runWorkflow(() => rejectGalleryAction(gallery.id, rejectReason), "Galería rechazada.")}
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
                        runWorkflow(() => scheduleGalleryAction(gallery.id, new Date(scheduleAt).toISOString()), "Publicación programada.")
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
        </div>
      </div>
    </div>
  );
}

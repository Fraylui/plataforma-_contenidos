"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import type { Article, ArticleType, Category, ContentImage } from "@/lib/api/types";
import type { AdminImage, ArticleInput, ContentVideoInput } from "@/lib/api/admin-types";
import type { ArticlePermissions } from "@/lib/admin/article-permissions";
import { articleTypeLabel, articleStatusLabel } from "@/lib/content-labels";
import { ArchiveButton, FormError } from "@/components/admin/ui";
import { Button, Card, CollapsibleCard, Combobox, DateTimeInput, Field, TextArea, TextInput } from "@/components/ui";
import { ContentImagesPicker } from "./content-images-picker";
import { VideoLinksEditor } from "./video-links-editor";
import { RichTextEditor } from "./rich-text-editor";
import {
  approveArticleAction,
  archiveArticleAction,
  createArticleAction,
  publishArticleAction,
  rejectArticleAction,
  scheduleArticleAction,
  submitArticleAction,
  updateArticleAction,
  type ActionResult,
} from "@/app/admin/(protected)/publicaciones/actions";

const ARTICLE_TYPES: ArticleType[] = ["GENERAL", "GUIA", "LISTA", "TUTORIAL", "HISTORIA", "ENTREVISTA"];

const ROBOTS_OPTIONS = ["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"];

interface ArticleFormProps {
  categories: Category[];
  allImages: AdminImage[];
  mode: "create" | "edit";
  article?: Article;
  permissions?: ArticlePermissions;
}

export function ArticleForm({
  categories,
  allImages,
  mode,
  article,
  permissions,
}: ArticleFormProps) {
  const router = useRouter();
  const readOnly = mode === "edit" && permissions !== undefined && !permissions.canEdit;

  const [title, setTitle] = useState(article?.title ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [articleType, setArticleType] = useState<ArticleType>(article?.articleType ?? "GENERAL");
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? categories[0]?.id ?? "");
  const [seoTitle, setSeoTitle] = useState(article?.seoTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(article?.metaDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(article?.canonicalUrl ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(article?.ogImageUrl ?? "");
  const [images, setImages] = useState<ContentImage[]>(article?.images ?? []);
  const [videos, setVideos] = useState<ContentVideoInput[]>(
    article?.videos.map((v) => ({
      url: `https://www.youtube.com/watch?v=${v.videoId}`,
      title: v.title,
      caption: v.caption,
    })) ?? [],
  );
  const [robots, setRobots] = useState(article?.robots ?? "index,follow");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

  function buildInput(): ArticleInput {
    return {
      title,
      excerpt: excerpt || null,
      body,
      articleType,
      categoryId,
      seoTitle: seoTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      ogImageUrl: ogImageUrl || null,
      images,
      videos,
      robots,
    };
  }

  async function handleSubmit() {
    setPending(true);
    setError(null);
    const result = mode === "create" ? await createArticleAction(buildInput()) : await updateArticleAction(article!.id, buildInput());
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
      {article && (
        <div className="flex flex-wrap items-center gap-3 rounded-card bg-surface px-4 py-3 text-sm shadow-card">
          <span className="font-medium text-foreground">Estado: {articleStatusLabel(article.status)}</span>
          {article.rejectionReason && (
            <span className="text-muted">Motivo de rechazo: {article.rejectionReason}</span>
          )}
        </div>
      )}

      {readOnly && (
        <p className="rounded-md border border-border bg-accent-soft px-4 py-3 text-sm text-accent">
          Esta publicación no se puede editar en su estado/rol actual. Puedes seguir viendo el contenido.
        </p>
      )}

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* Columna principal: lo que se escribe */}
        <div className="space-y-6">
          <Card title="Contenido">
            <Field label="Título" name="title">
              <TextInput
                type="text"
                value={title}
                disabled={readOnly}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>

            <Field label="Extracto (resumen corto, opcional)" name="excerpt">
              <TextArea
                value={excerpt}
                disabled={readOnly}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
              />
            </Field>

            <Field label="Cuerpo" name="body">
              <RichTextEditor value={body} onChange={setBody} disabled={readOnly} allImages={allImages} />
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
              <Button
                type="submit"
                disabled={pending || !title || !body || !categoryId}
                onClick={handleSubmit}
                className="w-full"
              >
                {pending ? "Guardando…" : mode === "create" ? "Crear borrador" : "Guardar cambios"}
              </Button>
            )}

            {mode === "edit" && article && permissions && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex flex-wrap gap-2">
                  {permissions.canSubmit && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => submitArticleAction(article.id), "Enviado a revisión.")}
                    >
                      Enviar a revisión
                    </Button>
                  )}
                  {permissions.canApprove && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => approveArticleAction(article.id), "Publicación aprobada.")}
                    >
                      Aprobar
                    </Button>
                  )}
                  {permissions.canPublish && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => publishArticleAction(article.id), "Publicación publicada.")}
                    >
                      Publicar ahora
                    </Button>
                  )}
                  {permissions.canArchive && (
                    <ArchiveButton
                      itemLabel="esta publicación"
                      disabled={pending}
                      onConfirm={() => runWorkflow(() => archiveArticleAction(article.id), "Publicación archivada.")}
                    />
                  )}
                </div>

                {permissions.canReject && (
                  <div className="space-y-2">
                    <Field label="Motivo de rechazo" name="rejectReason">
                      <TextInput
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending || !rejectReason.trim()}
                      onClick={() => runWorkflow(() => rejectArticleAction(article.id, rejectReason), "Publicación rechazada.")}
                      className="w-full"
                    >
                      Rechazar
                    </Button>
                  </div>
                )}

                {permissions.canSchedule && (
                  <div className="space-y-2">
                    <Field label="Programar publicación para" name="scheduleAt">
                      <DateTimeInput
                       
                        value={scheduleAt}
                        onChange={(e) => setScheduleAt(e.target.value)}
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending || !scheduleAt}
                      onClick={() =>
                        runWorkflow(
                          () => scheduleArticleAction(article.id, new Date(scheduleAt).toISOString()),
                          "Publicación programada.",
                        )
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
            <Field label="Tipo" name="articleType">
              <Combobox
                options={ARTICLE_TYPES.map((type) => ({ id: type, label: articleTypeLabel(type) }))}
                value={articleType}
                disabled={readOnly}
                // Campo obligatorio: ignoramos el toggle-a-null del Combobox — siempre
                // debe quedar un tipo seleccionado.
                onSelect={(id) => id && setArticleType(id as ArticleType)}
              />
            </Field>

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
            <Field label="Imágenes (opcional — la primera es la portada de tarjeta/feed)" name="images">
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

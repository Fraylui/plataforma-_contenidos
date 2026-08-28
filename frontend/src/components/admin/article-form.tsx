"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Article, ArticleType, Category, GeographicUnit } from "@/lib/api/types";
import type { AdminImage, ArticleInput } from "@/lib/api/admin-types";
import type { ArticlePermissions } from "@/lib/admin/article-permissions";
import { articleTypeLabel, articleStatusLabel } from "@/lib/content-labels";
import { AdminButton, FormField, formInputClass } from "@/components/admin/ui";
import { ArticleFeaturedImagePicker } from "./article-featured-image-picker";
import { GeographyPicker } from "./geography-picker";
import { TagInput } from "./tag-input";
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
} from "@/app/admin/(protected)/articulos/actions";

const ARTICLE_TYPES: ArticleType[] = [
  "ARTICULO",
  "NOTICIA",
  "REPORTAJE",
  "CRONICA",
  "GUIA",
  "ENTREVISTA",
  "HISTORIA",
  "RANKING",
  "RESENA",
  "TUTORIAL",
  "OPINION",
];

const ROBOTS_OPTIONS = ["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"];

interface ArticleFormProps {
  categories: Category[];
  allImages: AdminImage[];
  initialGeographyChain: GeographicUnit[];
  initialTagNames: string[];
  mode: "create" | "edit";
  article?: Article;
  permissions?: ArticlePermissions;
}

export function ArticleForm({
  categories,
  allImages,
  initialGeographyChain,
  initialTagNames,
  mode,
  article,
  permissions,
}: ArticleFormProps) {
  const router = useRouter();
  const readOnly = mode === "edit" && permissions !== undefined && !permissions.canEdit;

  const [title, setTitle] = useState(article?.title ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [articleType, setArticleType] = useState<ArticleType>(article?.articleType ?? "ARTICULO");
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? categories[0]?.id ?? "");
  const [geographyId, setGeographyId] = useState<string | null>(article?.geographyId ?? null);
  const [tags, setTags] = useState<string[]>(initialTagNames);
  const [seoTitle, setSeoTitle] = useState(article?.seoTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(article?.metaDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(article?.canonicalUrl ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(article?.ogImageUrl ?? "");
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(article?.featuredImageId ?? null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [removeYoutube, setRemoveYoutube] = useState(false);
  const [robots, setRobots] = useState(article?.robots ?? "index,follow");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

  function buildInput(): ArticleInput {
    return {
      title,
      excerpt: excerpt || null,
      body,
      articleType,
      categoryId,
      geographyId,
      tagNames: tags,
      seoTitle: seoTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      ogImageUrl: ogImageUrl || null,
      featuredImageId,
      youtubeUrl: resolveYoutubeUrlForSubmit(),
      robots,
    };
  }

  /**
   * El backend (ArticleService.resolveYoutubeVideoId) trata "sin URL" como
   * "sin video": cada PUT reemplaza youtubeVideoId con lo que se mande acá,
   * vacío incluido. Si no se toca el campo en una edición, hay que reenviar
   * la URL reconstruida a partir del video ya guardado — si no, cualquier
   * guardado (aunque sea solo cambiar el título) borraría el video.
   */
  function resolveYoutubeUrlForSubmit(): string | null {
    if (youtubeUrl.trim()) return youtubeUrl;
    if (removeYoutube) return null;
    if (article?.youtubeVideoId) return `https://www.youtube.com/watch?v=${article.youtubeVideoId}`;
    return null;
  }

  async function handleSubmit() {
    setPending(true);
    setError(null);
    setNotice(null);
    const result = mode === "create" ? await createArticleAction(buildInput()) : await updateArticleAction(article!.id, buildInput());
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
      {article && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
          <span className="font-medium text-foreground">Estado: {articleStatusLabel(article.status)}</span>
          {article.rejectionReason && (
            <span className="text-muted">Motivo de rechazo: {article.rejectionReason}</span>
          )}
        </div>
      )}

      {readOnly && (
        <p className="rounded-md border border-border bg-accent-soft px-4 py-3 text-sm text-accent">
          Este artículo no se puede editar en su estado/rol actual. Puedes seguir viendo el contenido.
        </p>
      )}

      <div className="space-y-4">
        <FormField label="Título">
          <input
            type="text"
            value={title}
            disabled={readOnly}
            onChange={(e) => setTitle(e.target.value)}
            className={formInputClass}
          />
        </FormField>

        <FormField label="Extracto (resumen corto, opcional)">
          <textarea
            value={excerpt}
            disabled={readOnly}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className={formInputClass}
          />
        </FormField>

        <FormField label="Contenido">
          <textarea
            value={body}
            disabled={readOnly}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            className={formInputClass}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Tipo">
            <select
              value={articleType}
              disabled={readOnly}
              onChange={(e) => setArticleType(e.target.value as ArticleType)}
              className={formInputClass}
            >
              {ARTICLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {articleTypeLabel(type)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Categoría">
            <select
              value={categoryId}
              disabled={readOnly}
              onChange={(e) => setCategoryId(e.target.value)}
              className={formInputClass}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Ubicación geográfica (opcional)">
          <GeographyPicker initialChain={initialGeographyChain} onChange={setGeographyId} />
        </FormField>

        <FormField label="Etiquetas">
          <TagInput value={tags} onChange={setTags} />
        </FormField>

        <FormField label="Foto destacada (opcional — se muestra en la tarjeta y la portada)">
          <ArticleFeaturedImagePicker
            allImages={allImages}
            value={featuredImageId}
            onChange={setFeaturedImageId}
            disabled={readOnly}
          />
        </FormField>

        <FormField label="Video de YouTube (URL, opcional)">
          <input
            type="text"
            value={youtubeUrl}
            disabled={readOnly || removeYoutube}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder={
              article?.youtubeVideoId ? "Ya tiene un video — pega otra URL para reemplazarlo" : "https://www.youtube.com/watch?v=…"
            }
            className={formInputClass}
          />
        </FormField>
        {article?.youtubeVideoId && (
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={removeYoutube}
              disabled={readOnly}
              onChange={(e) => setRemoveYoutube(e.target.checked)}
            />
            Quitar el video actual
          </label>
        )}
      </div>

      <fieldset className="space-y-4 border-t border-border pt-6">
        <legend className="text-sm font-medium text-foreground">SEO</legend>
        <FormField label="Título SEO (opcional, si no se define usa el título)">
          <input type="text" value={seoTitle} disabled={readOnly} onChange={(e) => setSeoTitle(e.target.value)} className={formInputClass} />
        </FormField>
        <FormField label="Meta descripción (opcional)">
          <textarea value={metaDescription} disabled={readOnly} onChange={(e) => setMetaDescription(e.target.value)} rows={2} className={formInputClass} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="URL canónica (opcional)">
            <input type="text" value={canonicalUrl} disabled={readOnly} onChange={(e) => setCanonicalUrl(e.target.value)} className={formInputClass} />
          </FormField>
          <FormField label="Imagen para Open Graph (URL, opcional)">
            <input type="text" value={ogImageUrl} disabled={readOnly} onChange={(e) => setOgImageUrl(e.target.value)} className={formInputClass} />
          </FormField>
        </div>
        <FormField label="Robots">
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

      {mode === "edit" && article && permissions && (
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="text-sm font-medium text-foreground">Flujo editorial</h2>
          <div className="flex flex-wrap gap-2">
            {permissions.canSubmit && (
              <AdminButton
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => runWorkflow(() => submitArticleAction(article.id), "Enviado a revisión.")}
              >
                Enviar a revisión
              </AdminButton>
            )}
            {permissions.canApprove && (
              <AdminButton
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => runWorkflow(() => approveArticleAction(article.id), "Artículo aprobado.")}
              >
                Aprobar
              </AdminButton>
            )}
            {permissions.canPublish && (
              <AdminButton
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => runWorkflow(() => publishArticleAction(article.id), "Artículo publicado.")}
              >
                Publicar ahora
              </AdminButton>
            )}
            {permissions.canArchive && (
              <AdminButton
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => runWorkflow(() => archiveArticleAction(article.id), "Artículo archivado.")}
              >
                Archivar
              </AdminButton>
            )}
          </div>

          {permissions.canReject && (
            <div className="flex flex-wrap items-end gap-2">
              <FormField label="Motivo de rechazo">
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className={formInputClass}
                />
              </FormField>
              <AdminButton
                type="button"
                variant="secondary"
                disabled={pending || !rejectReason.trim()}
                onClick={() => runWorkflow(() => rejectArticleAction(article.id, rejectReason), "Artículo rechazado.")}
              >
                Rechazar
              </AdminButton>
            </div>
          )}

          {permissions.canSchedule && (
            <div className="flex flex-wrap items-end gap-2">
              <FormField label="Programar publicación para">
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className={formInputClass}
                />
              </FormField>
              <AdminButton
                type="button"
                variant="secondary"
                disabled={pending || !scheduleAt}
                onClick={() =>
                  runWorkflow(
                    () => scheduleArticleAction(article.id, new Date(scheduleAt).toISOString()),
                    "Publicación programada.",
                  )
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


"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { History } from "lucide-react";
import { useLocalDraft } from "@/lib/admin/local-draft";
import type { Article, ArticleType, Category, ContentImage } from "@/lib/api/types";
import type { AdminImage, ArticleInput, ContentVideoInput } from "@/lib/api/admin-types";
import type { ArticlePermissions } from "@/lib/admin/article-permissions";
import { articleTypeLabel, articleStatusLabel } from "@/lib/content-labels";
import { AdminButton, ArchiveButton, CollapsibleSection, Combobox, FormError, FormField, SectionCard, formInputClass } from "@/components/admin/ui";
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

/**
 * Tipos que se ofrecen al crear contenido. Los de formato periodístico
 * (Noticia, Reportaje, Crónica, Entrevista, Opinión) ya no se ofrecen: la
 * plataforma no es un medio (CONTEXTO.md sección 1). Siguen existiendo en
 * el backend para no romper contenido ya guardado, y si se edita uno así
 * se muestra su tipo actual para poder cambiarlo.
 */
const ARTICLE_TYPES: ArticleType[] = ["ARTICULO", "HISTORIA", "GUIA", "RANKING", "TUTORIAL"];

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function toOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Valores técnicos de "robots" con palabras que se entienden sin saber SEO. */
const ROBOTS_OPTIONS = [
  { id: "index,follow", label: "Visible en Google (recomendado)" },
  { id: "noindex,follow", label: "No mostrar en Google" },
  { id: "index,nofollow", label: "Visible, sin seguir sus enlaces" },
  { id: "noindex,nofollow", label: "Oculto para buscadores" },
];

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
  const [articleType, setArticleType] = useState<ArticleType>(article?.articleType ?? "ARTICULO");
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
  // "Un día como hoy": texto en los inputs (vacío = sin fecha); el backend valida que la fecha exista.
  const [memorableDay, setMemorableDay] = useState(article?.memorableDay?.toString() ?? "");
  const [memorableMonth, setMemorableMonth] = useState(article?.memorableMonth?.toString() ?? "");
  const [memorableYear, setMemorableYear] = useState(article?.memorableYear?.toString() ?? "");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

  // Lo último guardado en el servidor: con qué se compara para saber si hay cambios sin guardar.
  const [savedInput, setSavedInput] = useState<ArticleInput>(() => buildInput());
  const draft = useLocalDraft(`articulo:${article?.id ?? "nuevo"}`, buildInput(), savedInput);

  function applyInput(input: ArticleInput) {
    setTitle(input.title);
    setExcerpt(input.excerpt ?? "");
    setBody(input.body);
    setArticleType(input.articleType);
    setCategoryId(input.categoryId);
    setSeoTitle(input.seoTitle ?? "");
    setMetaDescription(input.metaDescription ?? "");
    setCanonicalUrl(input.canonicalUrl ?? "");
    setOgImageUrl(input.ogImageUrl ?? "");
    setImages(input.images);
    setVideos(input.videos);
    setRobots(input.robots);
    setMemorableDay(input.memorableDay?.toString() ?? "");
    setMemorableMonth(input.memorableMonth?.toString() ?? "");
    setMemorableYear(input.memorableYear?.toString() ?? "");
  }

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
      memorableDay: toOptionalInt(memorableDay),
      memorableMonth: toOptionalInt(memorableMonth),
      memorableYear: toOptionalInt(memorableYear),
    };
  }

  async function handleSubmit() {
    setPending(true);
    setError(null);
    const input = buildInput();
    // Crear redirige a la edición del contenido nuevo: el borrador local se descarta antes.
    if (mode === "create") draft.clear();
    const result = mode === "create" ? await createArticleAction(input) : await updateArticleAction(article!.id, input);
    if (result.ok) {
      setSavedInput(input);
      draft.clear();
    }
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
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
          <span className="font-medium text-foreground">Estado: {articleStatusLabel(article.status)}</span>
          {article.rejectionReason && (
            <span className="text-muted">Motivo de rechazo: {article.rejectionReason}</span>
          )}
        </div>
      )}

      {readOnly && (
        <p className="rounded-md border border-border bg-accent-soft px-4 py-3 text-sm text-accent">
          Este contenido no se puede editar en su estado actual o con tu rol. Puedes seguir viéndolo.
        </p>
      )}

      {draft.recoverable && !readOnly && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-accent/40 bg-accent-soft px-4 py-3 text-sm">
          <History className="h-4 w-4 text-accent" aria-hidden="true" />
          <span className="text-foreground">
            Hay cambios sin guardar de la última vez ({new Date(draft.recoverable.savedAt).toLocaleString("es-PE")}).
          </span>
          <div className="ml-auto flex gap-2">
            <AdminButton
              type="button"
              onClick={() => {
                applyInput(draft.recoverable!.value as ArticleInput);
                draft.dismissRecoverable();
              }}
            >
              Recuperar
            </AdminButton>
            <AdminButton type="button" variant="secondary" onClick={() => draft.discardRecoverable()}>
              Descartar
            </AdminButton>
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* Columna principal: primero lo visual (es lo que se ve en la portada y al compartir), después el texto. */}
        <div className="space-y-6">
          <SectionCard title="Portada, fotos y videos">
            <FormField label="Fotos — la primera es la portada" name="images">
              <ContentImagesPicker allImages={allImages} value={images} onChange={setImages} disabled={readOnly} />
            </FormField>

            <FormField label="Videos — sube el video a YouTube y pega aquí su enlace" name="videos">
              <VideoLinksEditor value={videos} onChange={setVideos} disabled={readOnly} />
            </FormField>
          </SectionCard>

          <SectionCard title="Contenido">
            <FormField label="Título" name="title">
              <input
                type="text"
                value={title}
                disabled={readOnly}
                onChange={(e) => setTitle(e.target.value)}
                className={formInputClass}
              />
            </FormField>

            <FormField label="Resumen corto — se muestra en las tarjetas y al compartir (opcional)" name="excerpt">
              <textarea
                value={excerpt}
                disabled={readOnly}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                className={formInputClass}
              />
            </FormField>

            <FormField label="Contenido" name="body">
              <RichTextEditor value={body} onChange={setBody} disabled={readOnly} allImages={allImages} />
            </FormField>
          </SectionCard>

          <CollapsibleSection title="Avanzado: Google y redes sociales">
            <p className="text-xs text-muted">
              No hace falta tocar nada: si lo dejas vacío se usan el título, el resumen y la portada.
            </p>
            <FormField label="Título en Google" name="seoTitle">
              <input type="text" value={seoTitle} placeholder={title} disabled={readOnly} onChange={(e) => setSeoTitle(e.target.value)} className={formInputClass} />
            </FormField>
            <FormField label="Descripción en Google y al compartir" name="metaDescription">
              <textarea value={metaDescription} placeholder={excerpt} disabled={readOnly} onChange={(e) => setMetaDescription(e.target.value)} rows={2} className={formInputClass} />
            </FormField>
            <FormField label="Imagen al compartir (enlace) — si está vacío, se usa la portada" name="ogImageUrl">
              <input type="text" value={ogImageUrl} disabled={readOnly} onChange={(e) => setOgImageUrl(e.target.value)} className={formInputClass} />
            </FormField>
            <FormField label="Dirección original — solo si esto se publicó antes en otro sitio" name="canonicalUrl">
              <input type="text" value={canonicalUrl} disabled={readOnly} onChange={(e) => setCanonicalUrl(e.target.value)} className={formInputClass} />
            </FormField>
            <FormField label="Visibilidad en buscadores" name="robots">
              <Combobox options={ROBOTS_OPTIONS} value={robots} disabled={readOnly} onSelect={(id) => id && setRobots(id)} />
            </FormField>
          </CollapsibleSection>
        </div>

        {/* Barra lateral: publicar + metadata — visible sin scrollear todo el formulario */}
        <div className="space-y-6">
          <SectionCard title="Publicar">
            {error && <FormError message={error} />}
            {!readOnly && (
              <p className="text-xs text-muted" aria-live="polite">
                {draft.dirty ? "Cambios sin guardar (mientras tanto se guardan en este navegador)." : "Todo guardado."}
              </p>
            )}
            {!readOnly && (
              <AdminButton
                disabled={pending || !title || !body || !categoryId}
                onClick={handleSubmit}
                className="w-full"
              >
                {pending ? "Guardando…" : mode === "create" ? "Crear borrador" : "Guardar cambios"}
              </AdminButton>
            )}

            {mode === "edit" && article && permissions && (
              <div className="space-y-3 border-t border-border pt-4">
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
                      onClick={() => runWorkflow(() => approveArticleAction(article.id), "Publicación aprobada.")}
                    >
                      Aprobar
                    </AdminButton>
                  )}
                  {permissions.canPublish && (
                    <AdminButton
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => publishArticleAction(article.id), "Publicación publicada.")}
                    >
                      Publicar ahora
                    </AdminButton>
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
                    <FormField label="Motivo de rechazo" name="rejectReason">
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
                      onClick={() => runWorkflow(() => rejectArticleAction(article.id, rejectReason), "Publicación rechazada.")}
                      className="w-full"
                    >
                      Rechazar
                    </AdminButton>
                  </div>
                )}

                {permissions.canSchedule && (
                  <div className="space-y-2">
                    <FormField label="Programar publicación para" name="scheduleAt">
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
                      className="w-full"
                    >
                      Programar
                    </AdminButton>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Formato y tema">
            <FormField label="Formato" name="articleType">
              <Combobox
                options={(ARTICLE_TYPES.includes(articleType) ? ARTICLE_TYPES : [articleType, ...ARTICLE_TYPES]).map((type) => ({
                  id: type,
                  label: articleTypeLabel(type),
                }))}
                value={articleType}
                disabled={readOnly}
                // Campo obligatorio: ignoramos el toggle-a-null del Combobox — siempre
                // debe quedar un tipo seleccionado.
                onSelect={(id) => id && setArticleType(id as ArticleType)}
              />
            </FormField>

            <FormField label="Tema" name="categoryId">
              <Combobox
                options={categories.map((category) => ({ id: category.id, label: category.name }))}
                value={categoryId}
                disabled={readOnly}
                onSelect={(id) => id && setCategoryId(id)}
              />
            </FormField>
          </SectionCard>

          <SectionCard title="Un día como hoy">
            <p className="-mt-1 mb-3 text-xs text-muted">
              Opcional. Si este contenido recuerda una fecha (una batalla, una fundación, una fiesta), aparecerá en la
              portada ese día de cada año.
            </p>
            <div className="grid grid-cols-[4.5rem_1fr_5.5rem] gap-2">
              <FormField label="Día" name="memorableDay">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={31}
                  value={memorableDay}
                  disabled={readOnly}
                  onChange={(e) => setMemorableDay(e.target.value)}
                  className={formInputClass}
                />
              </FormField>
              <FormField label="Mes" name="memorableMonth">
                <select
                  value={memorableMonth}
                  disabled={readOnly}
                  onChange={(e) => setMemorableMonth(e.target.value)}
                  className={formInputClass}
                >
                  <option value="">—</option>
                  {MONTH_NAMES.map((name, index) => (
                    <option key={name} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Año" name="memorableYear">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={9999}
                  placeholder="Opc."
                  value={memorableYear}
                  disabled={readOnly}
                  onChange={(e) => setMemorableYear(e.target.value)}
                  className={formInputClass}
                />
              </FormField>
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  );
}

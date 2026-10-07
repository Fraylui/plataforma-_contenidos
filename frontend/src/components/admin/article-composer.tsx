"use client";

/* eslint-disable @next/next/no-img-element -- vista previa de la portada: URL subida o externa, sin optimizar */
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ImageSquare } from "@phosphor-icons/react";
import type { AdminImage, ContentVideoInput } from "@/lib/api/admin-types";
import type { Article, ArticleType, Category, ContentImage } from "@/lib/api/types";
import type { PublicationPermissions } from "@/lib/admin/publication";
import { articleTypeLabel } from "@/lib/content-labels";
import { imageUrl } from "@/lib/image-url";
import { FormError } from "@/components/admin/ui";
import { Card, CollapsibleCard, Combobox, Field, TextArea, TextInput } from "@/components/ui";
import { createArticleAction, updateArticleAction } from "@/app/admin/(protected)/publicaciones/actions";
import { ContentImagesPicker } from "./content-images-picker";
import { VideoLinksEditor } from "./video-links-editor";
import { RichTextEditor } from "./rich-text-editor";
import { PublishPanel } from "./publish-panel";
import { SharePreview, shareText } from "./share-preview";
import { useAutosave } from "./use-autosave";

const ARTICLE_TYPES: ArticleType[] = ["GENERAL", "GUIA", "LISTA", "TUTORIAL", "HISTORIA", "ENTREVISTA"];
const ROBOTS_OPTIONS = ["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"];

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), "Usa una dirección completa, que empiece con https://");

/** Mismos límites que ArticleRequest en el backend (título 200, descripción 500, texto obligatorio). */
const schema = z.object({
  title: z.string().trim().min(1, "Escribe un título.").max(200, "Máximo 200 caracteres."),
  excerpt: z.string().max(500, "Máximo 500 caracteres."),
  body: z.string().refine((html) => html.replace(/<[^>]*>/g, "").trim().length > 0, "Escribe el texto."),
  articleType: z.enum(ARTICLE_TYPES as [ArticleType, ...ArticleType[]]),
  categoryId: z.string().min(1, "Elige un tema."),
  seoTitle: z.string(),
  metaDescription: z.string(),
  canonicalUrl: optionalUrl,
  ogImageUrl: optionalUrl,
  robots: z.string(),
  images: z.array(z.custom<ContentImage>()),
  videos: z.array(z.custom<ContentVideoInput>()),
});

type Values = z.infer<typeof schema>;

function initialValues(article: Article | undefined, categories: Category[]): Values {
  return {
    title: article?.title ?? "",
    excerpt: article?.excerpt ?? "",
    body: article?.body ?? "",
    articleType: article?.articleType ?? "GENERAL",
    categoryId: article?.categoryId ?? categories[0]?.id ?? "",
    seoTitle: article?.seoTitle ?? "",
    metaDescription: article?.metaDescription ?? "",
    canonicalUrl: article?.canonicalUrl ?? "",
    ogImageUrl: article?.ogImageUrl ?? "",
    robots: article?.robots ?? "index,follow",
    images: article?.images ?? [],
    videos: (article?.videos ?? []).map((video) => ({
      url: `https://www.youtube.com/watch?v=${video.videoId}`,
      title: video.title,
      caption: video.caption,
    })),
  };
}

function toInput(values: Values) {
  const empty = (value: string) => value.trim() || null;
  return {
    title: values.title.trim(),
    excerpt: empty(values.excerpt),
    body: values.body,
    articleType: values.articleType,
    categoryId: values.categoryId,
    seoTitle: empty(values.seoTitle),
    metaDescription: empty(values.metaDescription),
    canonicalUrl: empty(values.canonicalUrl),
    ogImageUrl: empty(values.ogImageUrl),
    images: values.images,
    videos: values.videos,
    robots: values.robots,
  };
}

const TITLE_CLASS =
  "h-auto border-0 bg-transparent px-0 py-1 text-[28px] leading-tight font-bold tracking-tight " +
  "placeholder:text-muted/50 hover:bg-transparent focus:border-0 focus:bg-transparent focus:ring-0";

/**
 * Compositor de Publicaciones (spec 2026-10-07 §2): fotos primero, título
 * grande, descripción corta y texto; a la derecha el panel de publicar, tema
 * y la vista previa en el feed. Guarda solo el borrador cada 10 s y avisa
 * antes de salir con cambios sin guardar.
 */
export function ArticleComposer({
  categories,
  allImages,
  article,
  permissions,
  siteName,
}: {
  categories: Category[];
  allImages: AdminImage[];
  article?: Article;
  permissions: PublicationPermissions;
  siteName: string;
}) {
  const [id, setId] = useState(article?.id ?? "");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const status = article?.status ?? "DRAFT";
  const readOnly = !permissions.canEdit;

  const { control, register, handleSubmit, reset, getValues, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initialValues(article, categories),
  });
  const { errors, isDirty } = formState;
  const watched = useWatch({ control });

  async function persist(values: Values): Promise<string | null> {
    setSaving(true);
    setError(null);
    const input = toInput(values);
    let savedId = id;
    let failure: string | null = null;
    if (id) {
      const result = await updateArticleAction(id, input);
      if (!result.ok) failure = result.error;
    } else {
      const result = await createArticleAction(input);
      if (result.ok) savedId = result.data.id;
      else failure = result.error;
    }
    setSaving(false);
    if (failure) {
      setError(failure);
      toast.error(failure);
      return null;
    }
    if (!id) {
      setId(savedId);
      // Cambia la URL a la de edición sin recargar: quien escribe no pierde el foco.
      window.history.replaceState(null, "", `/admin/publicaciones/${savedId}`);
    }
    reset(values, { keepValues: true });
    setSavedAt(new Date());
    return savedId;
  }

  /** Guardar validando: errores en el campo y foco al primero. */
  function save(): Promise<string | null> {
    return new Promise((resolve) => {
      void handleSubmit(
        async (values) => resolve(await persist(values)),
        () => resolve(null),
      )();
    });
  }

  // Guardado automático solo del borrador y solo si ya es válido (en silencio: sin mover el foco).
  useAutosave({
    enabled: status === "DRAFT" && !readOnly,
    dirty: isDirty,
    save: async () => {
      const parsed = schema.safeParse(getValues());
      if (parsed.success) await persist(parsed.data);
    },
  });

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const cover = (watched.images ?? [])[0];
  const uploaded = cover?.imageId ? allImages.find((image) => image.id === cover.imageId) : undefined;
  const coverUrl = uploaded ? imageUrl(uploaded.url) : (cover?.externalUrl ?? null);
  const share = shareText({
    title: watched.title ?? "",
    excerpt: watched.excerpt ?? "",
    seoTitle: watched.seoTitle ?? "",
    metaDescription: watched.metaDescription ?? "",
  });
  const categoryName = categories.find((category) => category.id === watched.categoryId)?.name;

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      noValidate
      className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"
    >
      <div className="min-w-0 space-y-6">
        {readOnly && (
          <p className="rounded-control bg-info-soft px-4 py-3 text-sm text-foreground">
            Esta publicación no se puede editar en su estado actual. Puedes verla tal cual está.
          </p>
        )}

        <Card title="Fotos y videos" description="La primera foto es la portada en el feed y al compartir.">
          <Controller
            control={control}
            name="images"
            render={({ field }) => (
              <ContentImagesPicker allImages={allImages} value={field.value} onChange={field.onChange} disabled={readOnly} />
            )}
          />
          <Field label="Videos de YouTube (opcional)" name="videos">
            <Controller
              control={control}
              name="videos"
              render={({ field }) => <VideoLinksEditor value={field.value} onChange={field.onChange} disabled={readOnly} />}
            />
          </Field>
        </Card>

        <Card>
          <Field label="Título" name="title" hideLabel error={errors.title?.message}>
            <TextInput placeholder="Escribe un título" disabled={readOnly} className={TITLE_CLASS} {...register("title")} />
          </Field>
          <Field label="Descripción corta" name="excerpt" hint="Una o dos frases que inviten a abrirla." error={errors.excerpt?.message}>
            <TextArea
              rows={2}
              maxLength={500}
              disabled={readOnly}
              placeholder="¿De qué trata?"
              defaultValue={article?.excerpt ?? ""}
              {...register("excerpt")}
            />
          </Field>
          <Field label="Texto" name="body" error={errors.body?.message}>
            <Controller
              control={control}
              name="body"
              render={({ field }) => (
                <RichTextEditor value={field.value} onChange={field.onChange} disabled={readOnly} allImages={allImages} />
              )}
            />
          </Field>
        </Card>

        <CollapsibleCard title="Cómo se ve al compartir">
          <SharePreview
            siteName={siteName}
            path={`/publicaciones/${article?.slug ?? "…"}`}
            title={share.title}
            description={share.description}
            imageUrl={watched.ogImageUrl?.trim() || coverUrl}
          />
          <p className="text-sm text-muted">Se arma solo con el título, la descripción corta y la portada. Cámbialo solo si quieres otro texto para redes y buscadores.</p>
          <Field label="Título para redes y buscadores" name="seoTitle">
            <TextInput placeholder={watched.title || "Por defecto, el título"} disabled={readOnly} {...register("seoTitle")} />
          </Field>
          <Field label="Descripción para redes y buscadores" name="metaDescription">
            <TextArea
              rows={2}
              maxLength={160}
              disabled={readOnly}
              placeholder={watched.excerpt || "Por defecto, la descripción corta"}
              defaultValue={article?.metaDescription ?? ""}
              {...register("metaDescription")}
            />
          </Field>
          <Field label="Otra imagen para compartir (dirección web, opcional)" name="ogImageUrl" error={errors.ogImageUrl?.message}>
            <TextInput type="url" inputMode="url" placeholder="https://…" disabled={readOnly} {...register("ogImageUrl")} />
          </Field>
          <details className="group rounded-control bg-field px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium text-foreground">Avanzado</summary>
            <div className="mt-3 space-y-4 pb-1">
              <Field label="Dirección canónica (si ya se publicó en otro sitio)" name="canonicalUrl" error={errors.canonicalUrl?.message}>
                <TextInput type="url" inputMode="url" placeholder="https://…" disabled={readOnly} {...register("canonicalUrl")} />
              </Field>
              <Field label="Indexación en buscadores" name="robots">
                <Controller
                  control={control}
                  name="robots"
                  render={({ field }) => (
                    <Combobox
                      options={ROBOTS_OPTIONS.map((option) => ({ id: option, label: option }))}
                      value={field.value}
                      disabled={readOnly}
                      onSelect={(value) => value && field.onChange(value)}
                    />
                  )}
                />
              </Field>
            </div>
          </details>
        </CollapsibleCard>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-6">
        {error && <FormError message={error} />}
        <PublishPanel
          kind="articles"
          item={{ id, status, scheduledAt: article?.scheduledAt ?? null, reviewNote: article?.reviewNote ?? null }}
          permissions={permissions}
          dirty={isDirty}
          saving={saving}
          onSave={save}
          savedAt={savedAt}
        />

        <Card title="Tema y formato">
          <Field label="Tema" name="categoryId" error={errors.categoryId?.message}>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Combobox
                  options={categories.map((category) => ({ id: category.id, label: category.name }))}
                  value={field.value}
                  disabled={readOnly}
                  placeholder="Elige un tema"
                  onSelect={(value) => value && field.onChange(value)}
                />
              )}
            />
          </Field>
          <Field label="Formato" name="articleType">
            <Controller
              control={control}
              name="articleType"
              render={({ field }) => (
                <Combobox
                  options={ARTICLE_TYPES.map((type) => ({ id: type, label: articleTypeLabel(type) }))}
                  value={field.value}
                  disabled={readOnly}
                  onSelect={(value) => value && field.onChange(value as ArticleType)}
                />
              )}
            />
          </Field>
        </Card>

        <Card title="Vista previa en el feed">
          <FeedCardPreview
            siteName={siteName}
            title={watched.title ?? ""}
            excerpt={watched.excerpt ?? ""}
            coverUrl={coverUrl}
            categoryName={categoryName}
          />
        </Card>
      </aside>
    </form>
  );
}

/** Cómo se verá la tarjeta en el feed (sin me gusta ni compartir: aún no existe). */
function FeedCardPreview({
  siteName,
  title,
  excerpt,
  coverUrl,
  categoryName,
}: {
  siteName: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  categoryName?: string;
}) {
  return (
    <div className="overflow-hidden rounded-control bg-canvas">
      <p className="truncate px-3 py-2 text-xs font-semibold text-foreground">
        {siteName}
        {categoryName && <span className="font-normal text-muted"> · {categoryName}</span>}
      </p>
      <div className="flex aspect-square items-center justify-center bg-canvas-strong">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="size-full object-cover" />
        ) : (
          <ImageSquare aria-hidden="true" className="size-10 text-muted/60" />
        )}
      </div>
      <div className="space-y-0.5 px-3 py-2.5">
        <p className="line-clamp-2 text-sm font-bold text-foreground">{title || "Título de la publicación"}</p>
        {excerpt && <p className="line-clamp-2 text-xs text-muted">{excerpt}</p>}
      </div>
    </div>
  );
}

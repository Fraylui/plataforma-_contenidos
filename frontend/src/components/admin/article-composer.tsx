"use client";

import { Controller, FormProvider } from "react-hook-form";
import { z } from "zod";
import type { AdminImage, ArticleInput } from "@/lib/api/admin-types";
import type { Article, ArticleType, Category } from "@/lib/api/types";
import type { PublicationPermissions } from "@/lib/admin/publication";
import { articleTypeLabel } from "@/lib/content-labels";
import { Combobox, Field } from "@/components/ui";
import { createArticleAction, updateArticleAction } from "@/app/admin/(protected)/publicaciones/actions";
import { PublishPanel } from "./publish-panel";
import { useComposer } from "./composer/use-composer";
import { ComposerShell, MediaCard, TopicCard, useCoverUrl, WritingCard } from "./composer/sections";
import { ShareCard } from "./composer/share-card";
import { FeedCardPreview } from "./composer/feed-card-preview";
import { baseDefaults, baseFields, baseInput, bodyField, videosField, videosFromContent } from "./composer/schema";

const ARTICLE_TYPES: ArticleType[] = ["GENERAL", "GUIA", "LISTA", "TUTORIAL", "HISTORIA", "ENTREVISTA"];

const schema = z.object({
  ...baseFields,
  body: bodyField,
  articleType: z.enum(ARTICLE_TYPES as [ArticleType, ...ArticleType[]]),
  videos: videosField,
});

type Values = z.infer<typeof schema>;

function toInput(values: Values): ArticleInput {
  return { ...baseInput(values), title: values.title.trim(), body: values.body, articleType: values.articleType, videos: values.videos };
}

interface ArticleComposerProps {
  categories: Category[];
  allImages: AdminImage[];
  article?: Article;
  permissions: PublicationPermissions;
  siteName: string;
}

/**
 * Compositor de Publicaciones (spec 2026-10-07 §2): fotos primero, título
 * grande, descripción corta y texto; Publicar, tema y formato, vista previa
 * en el feed y «Cómo se ve al compartir». Las piezas viven en ./composer.
 */
export function ArticleComposer({ categories, allImages, article, permissions, siteName }: ArticleComposerProps) {
  const status = article?.status ?? "DRAFT";
  const readOnly = !permissions.canEdit;
  const { form, id, save, saving, savedAt, error } = useComposer({
    schema,
    defaultValues: {
      ...baseDefaults(article?.title, article, categories[0]?.id ?? ""),
      body: article?.body ?? "",
      articleType: article?.articleType ?? "GENERAL",
      videos: videosFromContent(article?.videos),
    },
    initialId: article?.id ?? "",
    status,
    readOnly,
    toInput,
    create: createArticleAction,
    update: updateArticleAction,
    adminPath: "/admin/publicaciones",
  });

  return (
    <FormProvider {...form}>
      <ComposerBody
        {...{ categories, allImages, article, permissions, siteName, readOnly, error }}
        publish={
          <PublishPanel
            kind="articles"
            item={{ id, status, scheduledAt: article?.scheduledAt ?? null, reviewNote: article?.reviewNote ?? null }}
            permissions={permissions}
            dirty={form.formState.isDirty}
            saving={saving}
            onSave={save}
            savedAt={savedAt}
          />
        }
      />
    </FormProvider>
  );
}

/** Dentro del FormProvider: las secciones leen el formulario por contexto. */
function ComposerBody({
  categories,
  allImages,
  article,
  siteName,
  readOnly,
  error,
  publish,
}: Omit<ArticleComposerProps, "permissions"> & { readOnly: boolean; error: string | null; publish: React.ReactNode }) {
  const coverUrl = useCoverUrl(allImages);
  return (
    <ComposerShell
      error={error}
      readOnlyNotice={readOnly ? "Esta publicación no se puede editar en su estado actual. Puedes verla tal cual está." : null}
      main={
        <>
          <MediaCard allImages={allImages} readOnly={readOnly} />
          <WritingCard excerptDefault={article?.excerpt ?? ""} allImages={allImages} readOnly={readOnly} />
          <ShareCard
            siteName={siteName}
            path={`/publicaciones/${article?.slug ?? "…"}`}
            coverUrl={coverUrl}
            metaDescriptionDefault={article?.metaDescription ?? ""}
            readOnly={readOnly}
          />
        </>
      }
      publish={publish}
      aside={
        <>
          <TopicCard title="Tema y formato" categories={categories} readOnly={readOnly}>
            <Field label="Formato" name="articleType">
              <Controller
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
          </TopicCard>
          <FeedCardPreview siteName={siteName} coverUrl={coverUrl} categories={categories} />
        </>
      }
    />
  );
}

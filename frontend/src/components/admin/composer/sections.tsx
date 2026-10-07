"use client";

import type { ReactNode } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { AdminImage } from "@/lib/api/admin-types";
import type { Category, ContentImage } from "@/lib/api/types";
import { imageUrl } from "@/lib/image-url";
import { FormError } from "@/components/admin/ui";
import { Card, Combobox, Field, TextArea, TextInput } from "@/components/ui";
import { ContentImagesPicker } from "../content-images-picker";
import { VideoLinksEditor } from "../video-links-editor";
import { RichTextEditor } from "../rich-text-editor";
import type { BaseComposerValues } from "./schema";

/**
 * Distribución de los compositores: contenido a la izquierda; a la derecha
 * Publicar (fijo en escritorio) y lo de organizar. En celular Publicar cierra
 * el flujo, como «Compartir» en Instagram.
 */
export function ComposerShell({
  readOnlyNotice,
  main,
  publish,
  aside,
  error,
}: {
  readOnlyNotice: string | null;
  main: ReactNode;
  publish: ReactNode;
  aside: ReactNode;
  error: string | null;
}) {
  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      noValidate
      className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"
    >
      <div className="min-w-0 space-y-6">
        {readOnlyNotice && <p className="rounded-control bg-info-soft px-4 py-3 text-sm text-foreground">{readOnlyNotice}</p>}
        {main}
      </div>
      <aside className="flex flex-col gap-6 lg:sticky lg:top-6">
        <div className="order-last space-y-4 lg:order-none">
          {error && <FormError message={error} />}
          {publish}
        </div>
        {aside}
      </aside>
    </form>
  );
}

/** Fotos (la primera es la portada) y, si el tipo los admite, videos de YouTube. */
export function MediaCard({
  allImages,
  readOnly,
  withVideos = true,
  description = "La primera foto es la portada en el feed y al compartir.",
}: {
  allImages: AdminImage[];
  readOnly: boolean;
  withVideos?: boolean;
  description?: string;
}) {
  const { control, formState } = useFormContext<BaseComposerValues & { videos?: unknown[] }>();
  const imagesError = formState.errors.images?.message;
  return (
    <Card title={withVideos ? "Fotos y videos" : "Fotos"} description={description}>
      <Controller
        control={control}
        name="images"
        render={({ field }) => (
          <ContentImagesPicker allImages={allImages} value={field.value} onChange={field.onChange} disabled={readOnly} />
        )}
      />
      {imagesError && (
        <p role="alert" className="text-xs font-medium text-danger-ink">
          {imagesError}
        </p>
      )}
      {withVideos && (
        <Field label="Videos de YouTube (opcional)" name="videos">
          <Controller
            control={control}
            name="videos"
            render={({ field }) => (
              <VideoLinksEditor value={(field.value ?? []) as never} onChange={field.onChange} disabled={readOnly} />
            )}
          />
        </Field>
      )}
    </Card>
  );
}

const TITLE_CLASS =
  "h-auto border-0 bg-transparent px-0 py-1 text-[28px] leading-tight font-bold tracking-tight " +
  "placeholder:text-muted/50 hover:bg-transparent focus:border-0 focus:bg-transparent focus:ring-0";

/** Título grande, descripción corta con contador y, si el tipo lo tiene, el texto. */
export function WritingCard({
  titleLabel = "Título",
  titlePlaceholder = "Escribe un título",
  excerptDefault,
  withBody = true,
  allImages,
  readOnly,
  children,
}: {
  titleLabel?: string;
  titlePlaceholder?: string;
  excerptDefault: string;
  withBody?: boolean;
  allImages: AdminImage[];
  readOnly: boolean;
  children?: ReactNode;
}) {
  const { control, register, formState } = useFormContext<BaseComposerValues & { body?: string }>();
  const { errors } = formState;
  return (
    <Card>
      <Field label={titleLabel} name="title" hideLabel error={errors.title?.message}>
        <TextInput placeholder={titlePlaceholder} disabled={readOnly} className={TITLE_CLASS} {...register("title")} />
      </Field>
      <Field label="Descripción corta" name="excerpt" hint="Una o dos frases que inviten a abrirla." error={errors.excerpt?.message}>
        <TextArea
          rows={2}
          maxLength={500}
          disabled={readOnly}
          placeholder="¿De qué trata?"
          defaultValue={excerptDefault}
          {...register("excerpt")}
        />
      </Field>
      {withBody && (
        <Field label="Texto" name="body" error={errors.body?.message}>
          <Controller
            control={control}
            name="body"
            render={({ field }) => (
              <RichTextEditor value={field.value ?? ""} onChange={field.onChange} disabled={readOnly} allImages={allImages} />
            )}
          />
        </Field>
      )}
      {children}
    </Card>
  );
}

/** Tema (obligatorio) y lo propio de cada tipo que organiza el contenido (formato, tipo de negocio). */
export function TopicCard({
  title = "Tema",
  categories,
  readOnly,
  children,
}: {
  title?: string;
  categories: Category[];
  readOnly: boolean;
  children?: ReactNode;
}) {
  const { control, formState } = useFormContext<BaseComposerValues>();
  return (
    <Card title={title}>
      <Field label="Tema" name="categoryId" error={formState.errors.categoryId?.message}>
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
      {children}
    </Card>
  );
}

/** URL de la portada (primera foto), subida o externa, para las vistas previas. */
export function useCoverUrl(allImages: AdminImage[]): string | null {
  const images = useWatch<BaseComposerValues, "images">({ name: "images" }) as ContentImage[] | undefined;
  const cover = images?.[0];
  const uploaded = cover?.imageId ? allImages.find((image) => image.id === cover.imageId) : undefined;
  return uploaded ? imageUrl(uploaded.url) : (cover?.externalUrl ?? null);
}

"use client";

import type { ReactNode } from "react";
import { FormProvider } from "react-hook-form";
import { z } from "zod";
import type { AdminImage, GalleryInput } from "@/lib/api/admin-types";
import type { Category, Gallery } from "@/lib/api/types";
import type { PublicationPermissions } from "@/lib/admin/publication";
import { createGalleryAction, updateGalleryAction } from "@/app/admin/(protected)/galerias/actions";
import { PublishPanel } from "./publish-panel";
import { useComposer } from "./composer/use-composer";
import { ComposerShell, MediaCard, TopicCard, useCoverUrl, WritingCard } from "./composer/sections";
import { ShareCard } from "./composer/share-card";
import { FeedCardPreview } from "./composer/feed-card-preview";
import { baseDefaults, baseFields, baseInput } from "./composer/schema";

/** Una galería son sus fotos: al menos una (como exige el backend). */
const schema = z.object({
  ...baseFields,
  images: baseFields.images.min(1, "Agrega al menos una foto."),
});

type Values = z.infer<typeof schema>;

function toInput(values: Values): GalleryInput {
  return { ...baseInput(values), title: values.title.trim() };
}

interface GalleryComposerProps {
  categories: Category[];
  allImages: AdminImage[];
  gallery?: Gallery;
  permissions: PublicationPermissions;
  siteName: string;
}

/** Compositor de Galerías: las fotos son el contenido; título y descripción corta las acompañan. */
export function GalleryComposer({ categories, allImages, gallery, permissions, siteName }: GalleryComposerProps) {
  const status = gallery?.status ?? "DRAFT";
  const readOnly = !permissions.canEdit;
  const { form, id, save, saving, savedAt, error } = useComposer({
    schema,
    defaultValues: baseDefaults(gallery?.title, gallery, categories[0]?.id ?? ""),
    initialId: gallery?.id ?? "",
    status,
    readOnly,
    toInput,
    create: createGalleryAction,
    update: updateGalleryAction,
    adminPath: "/admin/galerias",
  });

  return (
    <FormProvider {...form}>
      <GalleryBody
        {...{ categories, allImages, gallery, siteName, readOnly, error }}
        publish={
          <PublishPanel
            kind="galleries"
            item={{ id, status, scheduledAt: gallery?.scheduledAt ?? null, reviewNote: gallery?.reviewNote ?? null }}
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

function GalleryBody({
  categories,
  allImages,
  gallery,
  siteName,
  readOnly,
  error,
  publish,
}: Omit<GalleryComposerProps, "permissions"> & { readOnly: boolean; error: string | null; publish: ReactNode }) {
  const coverUrl = useCoverUrl(allImages);
  return (
    <ComposerShell
      error={error}
      readOnlyNotice={readOnly ? "Esta galería no se puede editar en su estado actual. Puedes verla tal cual está." : null}
      main={
        <>
          <MediaCard
            allImages={allImages}
            readOnly={readOnly}
            withVideos={false}
            description="Al menos una. Se ven como carrusel; la primera es la portada."
          />
          <WritingCard excerptDefault={gallery?.excerpt ?? ""} withBody={false} allImages={allImages} readOnly={readOnly} />
          <ShareCard
            siteName={siteName}
            path={`/galerias/${gallery?.slug ?? "…"}`}
            coverUrl={coverUrl}
            metaDescriptionDefault={gallery?.metaDescription ?? ""}
            readOnly={readOnly}
          />
        </>
      }
      publish={publish}
      aside={
        <>
          <TopicCard categories={categories} readOnly={readOnly} />
          <FeedCardPreview siteName={siteName} coverUrl={coverUrl} categories={categories} />
        </>
      }
    />
  );
}

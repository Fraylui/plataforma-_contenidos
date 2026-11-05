"use client";

import { Controller, FormProvider } from "react-hook-form";
import { z } from "zod";
import type { AdminImage, PublicationInput } from "@/lib/api/admin-types";
import type { Publication, PublicationType, Category } from "@/lib/api/types";
import type { PublicationPermissions } from "@/lib/admin/publication";
import { publicationTypeLabel } from "@/lib/content-labels";
import type { PublicationTemplate } from "@/lib/admin/publication-templates";
import { Combobox, Field } from "@/components/ui";
import { createPublicationAction, updatePublicationAction } from "@/app/admin/(protected)/publicaciones/actions";
import { PublishPanel } from "./publish-panel";
import { useComposer } from "./composer/use-composer";
import { ComposerShell, MediaCard, TopicCard, useCoverUrl, WritingCard } from "./composer/sections";
import { ShareCard } from "./composer/share-card";
import { FeedCardPreview } from "./composer/feed-card-preview";
import { PhonePreview } from "./composer/phone-preview";
import { baseDefaults, baseFields, baseInput, videosField, videosFromContent, hasSomethingToShow } from "./composer/schema";

const PUBLICATION_TYPES: PublicationType[] = ["GENERAL", "GUIA", "LISTA", "TUTORIAL", "HISTORIA"];

/*
 * Como un post de red social: con fotos o un video, el texto es opcional
 * (basta la descripción corta). Sin nada que mostrar, se pide algo.
 * Misma regla que PublicationService.bodyOrEmpty en el backend.
 */
const schema = z
  .object({
    ...baseFields,
    body: z.string(),
    publicationType: z.enum(PUBLICATION_TYPES as [PublicationType, ...PublicationType[]]),
    videos: videosField,
  })
  .refine((values) => hasSomethingToShow(values.body, values.images, values.videos), {
    path: ["body"],
    message: "Agrega fotos, un video o un texto.",
  });

type Values = z.infer<typeof schema>;

function toInput(values: Values): PublicationInput {
  return { ...baseInput(values), title: values.title.trim(), body: values.body, publicationType: values.publicationType, videos: values.videos };
}

interface PublicationComposerProps {
  categories: Category[];
  allImages: AdminImage[];
  publication?: Publication;
  permissions: PublicationPermissions;
  siteName: string;
  /** Solo al crear: estructura inicial del texto y formato (ver publication-templates). */
  template?: PublicationTemplate;
}

/**
 * Compositor de Publicaciones (spec 2026-10-07 §2): fotos primero, título
 * grande, descripción corta y texto; Publicar, tema y formato, vista previa
 * en el feed y «Cómo se ve al compartir». Las piezas viven en ./composer.
 */
export function PublicationComposer({ categories, allImages, publication, permissions, siteName, template }: PublicationComposerProps) {
  const status = publication?.status ?? "DRAFT";
  const readOnly = !permissions.canEdit;
  const { form, id, save, saving, savedAt, error } = useComposer({
    schema,
    defaultValues: {
      ...baseDefaults(publication?.title, publication),
      body: publication?.body ?? template?.body ?? "",
      publicationType: publication?.publicationType ?? template?.type ?? "GENERAL",
      videos: videosFromContent(publication?.videos),
    },
    initialId: publication?.id ?? "",
    status,
    readOnly,
    toInput,
    create: createPublicationAction,
    update: updatePublicationAction,
    adminPath: "/admin/publicaciones",
  });

  return (
    <FormProvider {...form}>
      <ComposerBody
        {...{ categories, allImages, publication, permissions, siteName, readOnly, error }}
        publish={
          <PublishPanel
            kind="publications"
            item={{ id, status, scheduledAt: publication?.scheduledAt ?? null }}
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
  publication,
  siteName,
  readOnly,
  error,
  publish,
}: Omit<PublicationComposerProps, "permissions"> & { readOnly: boolean; error: string | null; publish: React.ReactNode }) {
  const coverUrl = useCoverUrl(allImages);
  return (
    <ComposerShell
      error={error}
      readOnlyNotice={readOnly ? "Esta publicación no se puede editar en su estado actual. Puedes verla tal cual está." : null}
      main={
        <>
          <MediaCard allImages={allImages} readOnly={readOnly} />
          <WritingCard
            excerptDefault={publication?.excerpt ?? ""}
            allImages={allImages}
            readOnly={readOnly}
            bodyHint="Opcional si subiste fotos o un video."
            collapsibleBody
            excerptLabel="¿Qué quieres contar?"
            excerptHint="Una o dos frases: es lo que verá la gente junto a tus fotos."
            excerptPlaceholder="Escribe algo…"
          />
          <ShareCard
            siteName={siteName}
            path={`/publicaciones/${publication?.slug ?? "…"}`}
            coverUrl={coverUrl}
            metaDescriptionDefault={publication?.metaDescription ?? ""}
            readOnly={readOnly}
          />
        </>
      }
      publish={publish}
      aside={
        <>
          <TopicCard title="Tema" categories={categories} readOnly={readOnly}>
            <Field label="Tipo de post (opcional)" name="publicationType">
              <Controller
                name="publicationType"
                render={({ field }) => (
                  <Combobox
                    options={PUBLICATION_TYPES.map((type) => ({ id: type, label: publicationTypeLabel(type) }))}
                    value={field.value}
                    disabled={readOnly}
                    onSelect={(value) => value && field.onChange(value as PublicationType)}
                  />
                )}
              />
            </Field>
          </TopicCard>
          <FeedCardPreview siteName={siteName} coverUrl={coverUrl} categories={categories} />
          <PhonePreview siteName={siteName} categories={categories} allImages={allImages} />
        </>
      }
    />
  );
}

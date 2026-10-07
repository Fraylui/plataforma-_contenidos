"use client";

import type { ReactNode } from "react";
import { FormProvider } from "react-hook-form";
import { z } from "zod";
import type { AdminImage, PlaceInput } from "@/lib/api/admin-types";
import type { Category, Place } from "@/lib/api/types";
import type { PublicationPermissions } from "@/lib/admin/publication";
import { Card } from "@/components/ui";
import { createPlaceAction, updatePlaceAction } from "@/app/admin/(protected)/lugares/actions";
import { PublishPanel } from "./publish-panel";
import { useComposer } from "./composer/use-composer";
import { ComposerShell, MediaCard, TopicCard, useCoverUrl, WritingCard } from "./composer/sections";
import { ShareCard } from "./composer/share-card";
import { FeedCardPreview } from "./composer/feed-card-preview";
import { LocationFields } from "./composer/location-fields";
import {
  baseDefaults,
  baseFields,
  baseInput,
  bodyField,
  coordinateField,
  coordinateOrNull,
  videosField,
  videosFromContent,
} from "./composer/schema";

const schema = z.object({
  ...baseFields,
  title: z.string().trim().min(1, "Escribe el nombre del lugar.").max(200, "Máximo 200 caracteres."),
  body: bodyField,
  videos: videosField,
  latitude: coordinateField(-90, 90, "La latitud va de -90 a 90."),
  longitude: coordinateField(-180, 180, "La longitud va de -180 a 180."),
});

type Values = z.infer<typeof schema>;

function toInput(values: Values): PlaceInput {
  return {
    ...baseInput(values),
    name: values.title.trim(),
    body: values.body,
    videos: values.videos,
    latitude: coordinateOrNull(values.latitude),
    longitude: coordinateOrNull(values.longitude),
  };
}

interface PlaceComposerProps {
  categories: Category[];
  allImages: AdminImage[];
  place?: Place;
  permissions: PublicationPermissions;
  siteName: string;
}

/** Compositor de Lugares: fotos, nombre, descripción, texto y ubicación en el mapa. */
export function PlaceComposer({ categories, allImages, place, permissions, siteName }: PlaceComposerProps) {
  const status = place?.status ?? "DRAFT";
  const readOnly = !permissions.canEdit;
  const { form, id, save, saving, savedAt, error } = useComposer({
    schema,
    defaultValues: {
      ...baseDefaults(place?.name, place, categories[0]?.id ?? ""),
      body: place?.body ?? "",
      videos: videosFromContent(place?.videos),
      latitude: place?.latitude != null ? String(place.latitude) : "",
      longitude: place?.longitude != null ? String(place.longitude) : "",
    },
    initialId: place?.id ?? "",
    status,
    readOnly,
    toInput,
    create: createPlaceAction,
    update: updatePlaceAction,
    adminPath: "/admin/lugares",
  });

  return (
    <FormProvider {...form}>
      <PlaceBody
        {...{ categories, allImages, place, siteName, readOnly, error }}
        publish={
          <PublishPanel
            kind="places"
            item={{ id, status, scheduledAt: place?.scheduledAt ?? null, reviewNote: place?.reviewNote ?? null }}
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

function PlaceBody({
  categories,
  allImages,
  place,
  siteName,
  readOnly,
  error,
  publish,
}: Omit<PlaceComposerProps, "permissions"> & { readOnly: boolean; error: string | null; publish: ReactNode }) {
  const coverUrl = useCoverUrl(allImages);
  return (
    <ComposerShell
      error={error}
      readOnlyNotice={readOnly ? "Este lugar no se puede editar en su estado actual. Puedes verlo tal cual está." : null}
      main={
        <>
          <MediaCard allImages={allImages} readOnly={readOnly} />
          <WritingCard
            titleLabel="Nombre"
            titlePlaceholder="Nombre del lugar"
            excerptDefault={place?.excerpt ?? ""}
            allImages={allImages}
            readOnly={readOnly}
          />
          <Card title="Ubicación">
            <LocationFields readOnly={readOnly} />
          </Card>
          <ShareCard
            siteName={siteName}
            path={`/lugares/${place?.slug ?? "…"}`}
            coverUrl={coverUrl}
            metaDescriptionDefault={place?.metaDescription ?? ""}
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

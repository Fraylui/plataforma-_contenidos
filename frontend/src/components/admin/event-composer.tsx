"use client";

import type { ReactNode } from "react";
import { Controller, FormProvider, useFormContext, useWatch } from "react-hook-form";
import { z } from "zod";
import type { AdminImage, EventInput, PlaceOption } from "@/lib/api/admin-types";
import type { Category, Event } from "@/lib/api/types";
import type { PublicationPermissions } from "@/lib/admin/publication";
import { formatEventDateTime } from "@/lib/content-labels";
import { Card, Combobox, DateTimeInput, Field, TextInput } from "@/components/ui";
import { createEventAction, updateEventAction } from "@/app/admin/(protected)/eventos/actions";
import { PublishPanel } from "./publish-panel";
import { useComposer } from "./composer/use-composer";
import { ComposerShell, MediaCard, TopicCard, useCoverUrl, WritingCard } from "./composer/sections";
import { ShareCard } from "./composer/share-card";
import { FeedCardPreview } from "./composer/feed-card-preview";
import { baseDefaults, baseFields, baseInput, bodyField, emptyToNull, toDateTimeLocal, videosField, videosFromContent } from "./composer/schema";

/** Mismas reglas que el backend: empieza obligatoriamente y no termina antes de empezar. */
const schema = z
  .object({
    ...baseFields,
    body: bodyField,
    videos: videosField,
    startsAt: z.string().min(1, "Elige cuándo empieza."),
    endsAt: z.string(),
    placeId: z.string(),
    venueName: z.string().max(200, "Máximo 200 caracteres."),
  })
  .refine((values) => !values.endsAt || !values.startsAt || new Date(values.endsAt) >= new Date(values.startsAt), {
    path: ["endsAt"],
    message: "Termina antes de empezar: revisa las fechas.",
  });

type Values = z.infer<typeof schema>;

function toInput(values: Values): EventInput {
  return {
    ...baseInput(values),
    title: values.title.trim(),
    body: values.body,
    videos: values.videos,
    startsAt: new Date(values.startsAt).toISOString(),
    endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
    placeId: values.placeId || null,
    // Con un lugar del sitio elegido, el nombre libre sobra.
    venueName: values.placeId ? null : emptyToNull(values.venueName),
  };
}

interface EventComposerProps {
  categories: Category[];
  places: PlaceOption[];
  allImages: AdminImage[];
  event?: Event;
  permissions: PublicationPermissions;
  siteName: string;
}

/** Compositor de Eventos: fotos, título, texto y cuándo y dónde (fechas absolutas). */
export function EventComposer({ categories, places, allImages, event, permissions, siteName }: EventComposerProps) {
  const status = event?.status ?? "DRAFT";
  const readOnly = !permissions.canEdit;
  const { form, id, save, saving, savedAt, error } = useComposer({
    schema,
    defaultValues: {
      ...baseDefaults(event?.title, event, categories[0]?.id ?? ""),
      body: event?.body ?? "",
      videos: videosFromContent(event?.videos),
      startsAt: toDateTimeLocal(event?.startsAt),
      endsAt: toDateTimeLocal(event?.endsAt),
      placeId: event?.placeId ?? "",
      venueName: event?.venueName ?? "",
    },
    initialId: event?.id ?? "",
    status,
    readOnly,
    toInput,
    create: createEventAction,
    update: updateEventAction,
    adminPath: "/admin/eventos",
  });

  return (
    <FormProvider {...form}>
      <EventBody
        {...{ categories, places, allImages, event, siteName, readOnly, error }}
        publish={
          <PublishPanel
            kind="events"
            item={{ id, status, scheduledAt: event?.scheduledAt ?? null, reviewNote: event?.reviewNote ?? null }}
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

function EventBody({
  categories,
  places,
  allImages,
  event,
  siteName,
  readOnly,
  error,
  publish,
}: Omit<EventComposerProps, "permissions"> & { readOnly: boolean; error: string | null; publish: ReactNode }) {
  const coverUrl = useCoverUrl(allImages);
  const startsAt = useWatch<Values, "startsAt">({ name: "startsAt" });
  return (
    <ComposerShell
      error={error}
      readOnlyNotice={readOnly ? "Este evento no se puede editar en su estado actual. Puedes verlo tal cual está." : null}
      main={
        <>
          <MediaCard allImages={allImages} readOnly={readOnly} />
          <WritingCard excerptDefault={event?.excerpt ?? ""} allImages={allImages} readOnly={readOnly} />
          <WhenAndWhereCard places={places} readOnly={readOnly} />
          <ShareCard
            siteName={siteName}
            path={`/eventos/${event?.slug ?? "…"}`}
            coverUrl={coverUrl}
            metaDescriptionDefault={event?.metaDescription ?? ""}
            readOnly={readOnly}
          />
        </>
      }
      publish={publish}
      aside={
        <>
          <TopicCard categories={categories} readOnly={readOnly} />
          <FeedCardPreview
            siteName={siteName}
            coverUrl={coverUrl}
            categories={categories}
            meta={startsAt ? formatEventDateTime(new Date(startsAt).toISOString()) : null}
          />
        </>
      }
    />
  );
}

function WhenAndWhereCard({ places, readOnly }: { places: PlaceOption[]; readOnly: boolean }) {
  const { control, register, formState } = useFormContext<Values>();
  // Valores iniciales para la lectura absoluta bajo cada fecha (el input no controlado los toma de aquí).
  const defaults = formState.defaultValues ?? {};
  const placeId = useWatch<Values, "placeId">({ name: "placeId" });
  const { errors } = formState;
  return (
    <Card title="Cuándo y dónde">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Empieza" name="startsAt" required error={errors.startsAt?.message}>
          <DateTimeInput defaultValue={defaults.startsAt} disabled={readOnly} {...register("startsAt")} />
        </Field>
        <Field label="Termina (opcional)" name="endsAt" error={errors.endsAt?.message}>
          <DateTimeInput defaultValue={defaults.endsAt} disabled={readOnly} {...register("endsAt")} />
        </Field>
      </div>
      <Field label="Lugar del sitio (opcional)" name="placeId" hint="Si el lugar ya está en Lugares, el evento queda enlazado a él.">
        <Controller
          control={control}
          name="placeId"
          render={({ field }) => (
            <Combobox
              options={places.map((place) => ({ id: place.id, label: place.name }))}
              value={field.value || null}
              disabled={readOnly}
              placeholder="Buscar un lugar"
              onSelect={(value) => field.onChange(value ?? "")}
            />
          )}
        />
      </Field>
      {!placeId && (
        <Field label="O el nombre del lugar (opcional)" name="venueName" error={errors.venueName?.message}>
          <TextInput placeholder="Plaza de Armas, Teatro Municipal…" disabled={readOnly} {...register("venueName")} />
        </Field>
      )}
    </Card>
  );
}

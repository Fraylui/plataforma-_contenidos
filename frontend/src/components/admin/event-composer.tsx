"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Controller, FormProvider, useFormContext, useWatch } from "react-hook-form";
import { z } from "zod";
import type { AdminImage, EventInput, PlaceOption } from "@/lib/api/admin-types";
import type { Category, Event } from "@/lib/api/types";
import type { PublicationPermissions } from "@/lib/admin/publication";
import { formatAgendaDate, siteDateString, siteMidnightIso } from "@/lib/agenda-date";
import { Card, Checkbox, Combobox, DateTimeInput, Field, TextInput } from "@/components/ui";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { createEventAction, updateEventAction } from "@/app/admin/(protected)/eventos/actions";
import { PublishPanel } from "./publish-panel";
import { useComposer } from "./composer/use-composer";
import { ComposerShell, MediaCard, TopicCard, useCoverUrl, WritingCard } from "./composer/sections";
import { ShareCard } from "./composer/share-card";
import { FeedCardPreview } from "./composer/feed-card-preview";
import { baseDefaults, baseFields, baseInput, bodyField, emptyToNull, toDateTimeLocal, videosField, videosFromContent } from "./composer/schema";

const THIS_YEAR = new Date().getFullYear();

/**
 * Mismas reglas que el backend: la fecha es obligatoria, no termina antes de
 * empezar y «desde el año» solo existe en las que se repiten (año pasado).
 */
const schema = z
  .object({
    ...baseFields,
    body: bodyField,
    videos: videosField,
    recursYearly: z.boolean(),
    allDay: z.boolean(),
    sinceYear: z
      .string()
      .regex(/^\d{0,4}$/, "Solo el año, por ejemplo 1821.")
      .refine((v) => !v || (Number(v) >= 1 && Number(v) <= THIS_YEAR), "Tiene que ser un año pasado."),
    startsAt: z.string().min(1, "Elige la fecha."),
    endsAt: z.string(),
    placeId: z.string(),
    venueName: z.string().max(200, "Máximo 200 caracteres."),
  })
  .refine((values) => values.allDay || !values.endsAt || !values.startsAt || new Date(values.endsAt) >= new Date(values.startsAt), {
    path: ["endsAt"],
    message: "Termina antes de empezar: revisa las fechas.",
  });

type Values = z.infer<typeof schema>;

/** Todo el día: el campo trae solo la fecha («2026-07-28») y vale desde la medianoche del sitio (Lima). */
function startsAtIso(values: Pick<Values, "startsAt" | "allDay">): string {
  return values.allDay ? siteMidnightIso(values.startsAt) : new Date(values.startsAt).toISOString();
}

function toInput(values: Values): EventInput {
  return {
    ...baseInput(values),
    title: values.title.trim(),
    body: values.body,
    videos: values.videos,
    recursYearly: values.recursYearly,
    allDay: values.allDay,
    sinceYear: values.recursYearly && values.sinceYear ? Number(values.sinceYear) : null,
    startsAt: startsAtIso(values),
    endsAt: !values.allDay && values.endsAt ? new Date(values.endsAt).toISOString() : null,
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

/**
 * Compositor de Fechas de la Agenda (spec 2026-10-16): fotos, título, texto
 * y cuándo — una fecha que se repite cada año (28 de julio, Batalla de
 * Ayacucho) o única (un eclipse), de todo el día o con hora — y dónde.
 * Recuerda la regla: lo que alguien pagó es un anuncio, no una fecha.
 */
export function EventComposer({ categories, places, allImages, event, permissions, siteName }: EventComposerProps) {
  const status = event?.status ?? "DRAFT";
  const readOnly = !permissions.canEdit;
  const { form, id, save, saving, savedAt, error } = useComposer({
    schema,
    defaultValues: {
      ...baseDefaults(event?.title, event, categories[0]?.id ?? ""),
      body: event?.body ?? "",
      videos: videosFromContent(event?.videos),
      // Lo más común en la Agenda: fechas cívicas que vuelven cada año, de todo el día.
      recursYearly: event?.recursYearly ?? true,
      allDay: event?.allDay ?? true,
      sinceYear: event?.sinceYear ? String(event.sinceYear) : "",
      startsAt: event?.allDay ? siteDateString(event.startsAt) : toDateTimeLocal(event?.startsAt),
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
            item={{ id, status, scheduledAt: event?.scheduledAt ?? null }}
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
  const [startsAt, allDay, recursYearly, sinceYear] = useWatch<Values, ["startsAt", "allDay", "recursYearly", "sinceYear"]>({
    name: ["startsAt", "allDay", "recursYearly", "sinceYear"],
  });
  const validStart = Boolean(startsAt) && (allDay ? /^\d{4}-\d{2}-\d{2}/.test(startsAt) : !Number.isNaN(new Date(startsAt).getTime()));
  return (
    <ComposerShell
      error={error}
      readOnlyNotice={readOnly ? "Esta fecha no se puede editar en su estado actual. Puedes verla tal cual está." : null}
      main={
        <>
          <PaidContentRule />
          <MediaCard allImages={allImages} readOnly={readOnly} />
          <WritingCard excerptDefault={event?.excerpt ?? ""} allImages={allImages} readOnly={readOnly} />
          <WhenAndWhereCard places={places} readOnly={readOnly} />
          <ShareCard
            siteName={siteName}
            path={`/agenda/${event?.slug ?? "…"}`}
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
            meta={
              validStart
                ? formatAgendaDate({
                    at: startsAtIso({ startsAt, allDay }),
                    allDay,
                    recursYearly,
                    sinceYear: sinceYear ? Number(sinceYear) : null,
                  })
                : null
            }
          />
        </>
      }
    />
  );
}

/**
 * La regla que separa contenido de publicidad (D.L. 1044, principio de
 * autenticidad): si hubo pago o canje, va como anuncio «Patrocinado».
 */
function PaidContentRule() {
  return (
    <p className="rounded-card bg-accent-soft px-4 py-3 text-sm text-foreground">
      <strong className="font-semibold">¿Te pagaron o te dieron algo a cambio</strong> (entradas, canje, un descuento)? Entonces
      no es una fecha de la Agenda: es publicidad y tiene que salir como «Patrocinado».{" "}
      <Link href="/admin/anunciantes" className="font-semibold text-accent underline underline-offset-2">
        Crear un anuncio
      </Link>
    </p>
  );
}

const RECURRENCE_OPTIONS: { value: "YEARLY" | "ONCE"; label: string }[] = [
  { value: "YEARLY", label: "Se repite cada año" },
  { value: "ONCE", label: "Solo una vez" },
];

function WhenAndWhereCard({ places, readOnly }: { places: PlaceOption[]; readOnly: boolean }) {
  const { control, register, formState, setValue } = useFormContext<Values>();
  // Valores iniciales para la lectura absoluta bajo cada fecha (el input no controlado los toma de aquí).
  const defaults = formState.defaultValues ?? {};
  const [placeId, recursYearly, allDay] = useWatch<Values, ["placeId", "recursYearly", "allDay"]>({
    name: ["placeId", "recursYearly", "allDay"],
  });
  const { errors } = formState;
  return (
    <Card title="Cuándo y dónde">
      <SegmentedControl
        label="Cada cuánto"
        options={RECURRENCE_OPTIONS}
        value={recursYearly ? "YEARLY" : "ONCE"}
        onChange={(v) => setValue("recursYearly", v === "YEARLY", { shouldDirty: true })}
      />
      <Checkbox
        label="Todo el día"
        description="Sin hora: lo normal en fechas cívicas y aniversarios."
        disabled={readOnly}
        {...register("allDay")}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {allDay ? (
          <Field
            key="date"
            label="Fecha"
            name="startsAt"
            required
            hint={recursYearly ? "El año no importa: vuelve cada año el mismo día." : undefined}
            error={errors.startsAt?.message}
          >
            <DateTimeInput type="date" defaultValue={defaults.startsAt?.slice(0, 10)} disabled={readOnly} {...register("startsAt")} />
          </Field>
        ) : (
          <Field key="datetime" label="Empieza" name="startsAt" required error={errors.startsAt?.message}>
            <DateTimeInput defaultValue={defaults.startsAt} disabled={readOnly} {...register("startsAt")} />
          </Field>
        )}
        {recursYearly ? (
          <Field label="Desde el año (opcional)" name="sinceYear" hint="Por ejemplo 1821 para Fiestas Patrias." error={errors.sinceYear?.message}>
            <TextInput inputMode="numeric" maxLength={4} placeholder="1821" disabled={readOnly} {...register("sinceYear")} />
          </Field>
        ) : !allDay ? (
          <Field label="Termina (opcional)" name="endsAt" error={errors.endsAt?.message}>
            <DateTimeInput defaultValue={defaults.endsAt} disabled={readOnly} {...register("endsAt")} />
          </Field>
        ) : null}
      </div>
      <Field label="Lugar del sitio (opcional)" name="placeId" hint="Si el lugar ya está en Lugares, la fecha queda enlazada a él.">
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

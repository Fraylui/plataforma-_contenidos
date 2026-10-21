"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Controller, FormProvider, useFormContext, useWatch } from "react-hook-form";
import { z } from "zod";
import type { AdminImage, CelebrationInput, PlaceOption } from "@/lib/api/admin-types";
import type { Category, Celebration } from "@/lib/api/types";
import type { PublicationPermissions } from "@/lib/admin/publication";
import { formatCelebrationDate, siteDateString, siteMidnightIso } from "@/lib/celebration-date";
import { celebrationPlace, COUNTRY_OPTIONS } from "@/lib/countries";
import { Card, Checkbox, Combobox, DateTimeInput, Field, TextInput } from "@/components/ui";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { createCelebrationAction, updateCelebrationAction } from "@/app/admin/(protected)/celebraciones/actions";
import { PublishPanel } from "./publish-panel";
import { useComposer } from "./composer/use-composer";
import { ComposerShell, MediaCard, TopicCard, useCoverUrl, WritingCard } from "./composer/sections";
import { ShareCard } from "./composer/share-card";
import { FeedCardPreview } from "./composer/feed-card-preview";
import { baseDefaults, baseFields, baseInput, bodyField, emptyToNull, toDateTimeLocal, videosField, videosFromContent } from "./composer/schema";

const THIS_YEAR = new Date().getFullYear();

type ScopeKind = "WORLD" | "COUNTRY" | "REGION";

/**
 * Mismas reglas que el backend: la fecha es obligatoria, no termina antes de
 * empezar, «desde el año» solo existe en las que se repiten (año pasado) y
 * una celebración de un país o región dice cuál.
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
    scopeKind: z.enum(["WORLD", "COUNTRY", "REGION"]),
    scopeCountry: z.string(),
    scopeRegion: z.string().max(100, "Máximo 100 caracteres."),
  })
  .refine((values) => values.scopeKind === "WORLD" || /^[A-Z]{2}$/.test(values.scopeCountry), {
    path: ["scopeCountry"],
    message: "Elige el país.",
  })
  .refine((values) => values.scopeKind !== "REGION" || values.scopeRegion.trim().length > 0, {
    path: ["scopeRegion"],
    message: "Escribe la región (por ejemplo Ayacucho).",
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

function toInput(values: Values): CelebrationInput {
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
    scopeCountry: values.scopeKind === "WORLD" ? null : values.scopeCountry,
    scopeRegion: values.scopeKind === "REGION" ? values.scopeRegion.trim() : null,
  };
}

function dateToEdit(celebration: Celebration): string {
  return celebration.recursYearly ? celebration.nextOccurrenceAt : celebration.startsAt;
}

function scopeKindOf(celebration: Celebration | undefined): ScopeKind {
  if (!celebration) return "COUNTRY";
  if (celebration.scopeRegion) return "REGION";
  return celebration.scopeCountry ? "COUNTRY" : "WORLD";
}

interface CelebrationComposerProps {
  categories: Category[];
  places: PlaceOption[];
  allImages: AdminImage[];
  celebration?: Celebration;
  permissions: PublicationPermissions;
  siteName: string;
  /** País del sitio (Configuración): por defecto una celebración nueva es de ese país. */
  homeCountry: string;
}

/**
 * Compositor de Celebraciones (spec 2026-10-16): fotos, título, texto
 * y cuándo — una fecha que se repite cada año (28 de julio, Batalla de
 * Ayacucho) o única (un eclipse), de todo el día o con hora — y dónde.
 * Recuerda la regla: lo que alguien pagó es un anuncio, no una fecha.
 */
export function CelebrationComposer({ categories, places, allImages, celebration, permissions, siteName, homeCountry }: CelebrationComposerProps) {
  const status = celebration?.status ?? "DRAFT";
  const readOnly = !permissions.canEdit;
  const { form, id, save, saving, savedAt, error } = useComposer({
    schema,
    defaultValues: {
      ...baseDefaults(celebration?.title, celebration),
      body: celebration?.body ?? "",
      videos: videosFromContent(celebration?.videos),
      // Lo más común: fechas cívicas que vuelven cada año, de todo el día.
      recursYearly: celebration?.recursYearly ?? true,
      allDay: celebration?.allDay ?? true,
      sinceYear: celebration?.sinceYear ? String(celebration.sinceYear) : "",
      // En las que se repiten se carga la próxima vez que tocan: el año de origen no importa (y antes de 1908 Lima
      // usaba la hora solar, que corría la medianoche al día anterior).
      startsAt: celebration?.allDay ? siteDateString(dateToEdit(celebration)) : toDateTimeLocal(celebration && dateToEdit(celebration)),
      endsAt: toDateTimeLocal(celebration?.endsAt),
      placeId: celebration?.placeId ?? "",
      venueName: celebration?.venueName ?? "",
      // Lo local es lo común; «todo el mundo» se elige a propósito (si no, un visitante de México vería fechas peruanas).
      scopeKind: scopeKindOf(celebration),
      scopeCountry: celebration?.scopeCountry ?? homeCountry,
      scopeRegion: celebration?.scopeRegion ?? "",
    },
    initialId: celebration?.id ?? "",
    status,
    readOnly,
    toInput,
    create: createCelebrationAction,
    update: updateCelebrationAction,
    adminPath: "/admin/celebraciones",
  });

  return (
    <FormProvider {...form}>
      <CelebrationBody
        {...{ categories, places, allImages, celebration, siteName, readOnly, error }}
        publish={
          <PublishPanel
            kind="celebrations"
            item={{ id, status, scheduledAt: celebration?.scheduledAt ?? null }}
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

function CelebrationBody({
  categories,
  places,
  allImages,
  celebration,
  siteName,
  readOnly,
  error,
  publish,
}: Omit<CelebrationComposerProps, "permissions" | "homeCountry"> & { readOnly: boolean; error: string | null; publish: ReactNode }) {
  const coverUrl = useCoverUrl(allImages);
  const [startsAt, allDay, recursYearly, sinceYear] = useWatch<Values, ["startsAt", "allDay", "recursYearly", "sinceYear"]>({
    name: ["startsAt", "allDay", "recursYearly", "sinceYear"],
  });
  const validStart = Boolean(startsAt) && (allDay ? /^\d{4}-\d{2}-\d{2}/.test(startsAt) : !Number.isNaN(new Date(startsAt).getTime()));
  return (
    <ComposerShell
      error={error}
      readOnlyNotice={readOnly ? "Esta celebración no se puede editar en su estado actual. Puedes verla tal cual está." : null}
      main={
        <>
          <PaidContentRule />
          <MediaCard allImages={allImages} readOnly={readOnly} />
          <WritingCard excerptDefault={celebration?.excerpt ?? ""} allImages={allImages} readOnly={readOnly} />
          <WhenAndWhereCard places={places} readOnly={readOnly} />
          <ScopeCard readOnly={readOnly} />
          <ShareCard
            siteName={siteName}
            path={`/celebraciones/${celebration?.slug ?? "…"}`}
            coverUrl={coverUrl}
            metaDescriptionDefault={celebration?.metaDescription ?? ""}
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
                ? formatCelebrationDate({
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
      no es una celebración: es publicidad y tiene que salir como «Patrocinado».{" "}
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
    <Card title="Fecha y lugar">
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
      <Field label="Lugar del sitio (opcional)" name="placeId" hint="Si el lugar ya está en Lugares, la celebración queda enlazada a él.">
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

const SCOPE_OPTIONS: { value: ScopeKind; label: string }[] = [
  { value: "COUNTRY", label: "Un país" },
  { value: "REGION", label: "Una región" },
  { value: "WORLD", label: "Todo el mundo" },
];

/**
 * Dónde se celebra (como los Doodles de Google): «Hoy se celebra» muestra a
 * cada visitante lo de su región, su país y lo mundial. El archivo de
 * Celebraciones muestra todo.
 */
function ScopeCard({ readOnly }: { readOnly: boolean }) {
  const { control, register, formState, setValue } = useFormContext<Values>();
  const [scopeKind, scopeCountry, scopeRegion] = useWatch<Values, ["scopeKind", "scopeCountry", "scopeRegion"]>({
    name: ["scopeKind", "scopeCountry", "scopeRegion"],
  });
  const { errors } = formState;
  const summary = celebrationPlace(
    scopeKind === "WORLD" || !scopeCountry ? null : scopeCountry,
    scopeKind === "REGION" && scopeRegion.trim() ? scopeRegion.trim() : null,
  );
  return (
    <Card title="Dónde se celebra">
      <SegmentedControl
        label="Dónde se celebra"
        options={SCOPE_OPTIONS}
        value={scopeKind}
        onChange={(v) => setValue("scopeKind", v, { shouldDirty: true })}
      />
      {scopeKind !== "WORLD" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="País" name="scopeCountry" required error={errors.scopeCountry?.message}>
            <Controller
              control={control}
              name="scopeCountry"
              render={({ field }) => (
                <Combobox
                  options={COUNTRY_OPTIONS}
                  value={field.value || null}
                  disabled={readOnly}
                  placeholder="Buscar un país"
                  onSelect={(value) => field.onChange(value ?? "")}
                />
              )}
            />
          </Field>
          {scopeKind === "REGION" && (
            <Field label="Región" name="scopeRegion" required hint="Como la conoce la gente: Ayacucho, Cusco, Jalisco…" error={errors.scopeRegion?.message}>
              <TextInput placeholder="Ayacucho" disabled={readOnly} {...register("scopeRegion")} />
            </Field>
          )}
        </div>
      )}
      <p role="status" className="rounded-md bg-canvas px-3 py-2 text-xs text-foreground">
        <span className="font-semibold">«Hoy se celebra» la mostrará a visitantes de:</span> {summary}.
      </p>
    </Card>
  );
}

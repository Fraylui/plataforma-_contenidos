"use client";

import type { ReactNode } from "react";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
import { z } from "zod";
import type { AdminImage, BusinessInput, PlaceOption } from "@/lib/api/admin-types";
import type { Business, BusinessType, Category } from "@/lib/api/types";
import type { PublicationPermissions } from "@/lib/admin/publication";
import { businessTypeLabel } from "@/lib/content-labels";
import { Card, Combobox, Field, TextInput } from "@/components/ui";
import { createBusinessAction, updateBusinessAction } from "@/app/admin/(protected)/directorio/actions";
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
  emptyToNull,
  optionalUrl,
  videosField,
  videosFromContent,
} from "./composer/schema";

const BUSINESS_TYPES: BusinessType[] = ["RESTAURANT", "HOTEL", "SERVICE", "SHOP", "OTHER"];

/** Mismos límites que BusinessRequest en el backend (dirección 300, teléfono 50, correo válido). */
const schema = z.object({
  ...baseFields,
  title: z.string().trim().min(1, "Escribe el nombre del negocio.").max(200, "Máximo 200 caracteres."),
  body: bodyField,
  videos: videosField,
  businessType: z.enum(BUSINESS_TYPES as [BusinessType, ...BusinessType[]]),
  placeId: z.string(),
  address: z.string().max(300, "Máximo 300 caracteres."),
  phone: z.string().max(50, "Máximo 50 caracteres."),
  email: z.string().trim().refine((value) => value === "" || z.email().safeParse(value).success, "Escribe un correo válido."),
  website: optionalUrl,
  latitude: coordinateField(-90, 90, "La latitud va de -90 a 90."),
  longitude: coordinateField(-180, 180, "La longitud va de -180 a 180."),
});

type Values = z.infer<typeof schema>;

function toInput(values: Values): BusinessInput {
  return {
    ...baseInput(values),
    name: values.title.trim(),
    body: values.body,
    videos: values.videos,
    businessType: values.businessType,
    placeId: values.placeId || null,
    address: emptyToNull(values.address),
    phone: emptyToNull(values.phone),
    email: emptyToNull(values.email),
    website: emptyToNull(values.website),
    latitude: coordinateOrNull(values.latitude),
    longitude: coordinateOrNull(values.longitude),
  };
}

interface BusinessComposerProps {
  categories: Category[];
  places: PlaceOption[];
  allImages: AdminImage[];
  business?: Business;
  permissions: PublicationPermissions;
  siteName: string;
}

/** Compositor del Directorio: fotos, nombre, texto, contacto y ubicación del negocio. */
export function BusinessComposer({ categories, places, allImages, business, permissions, siteName }: BusinessComposerProps) {
  const status = business?.status ?? "DRAFT";
  const readOnly = !permissions.canEdit;
  const { form, id, save, saving, savedAt, error } = useComposer({
    schema,
    defaultValues: {
      ...baseDefaults(business?.name, business, categories[0]?.id ?? ""),
      body: business?.body ?? "",
      videos: videosFromContent(business?.videos),
      businessType: business?.businessType ?? "RESTAURANT",
      placeId: business?.placeId ?? "",
      address: business?.address ?? "",
      phone: business?.phone ?? "",
      email: business?.email ?? "",
      website: business?.website ?? "",
      latitude: business?.latitude != null ? String(business.latitude) : "",
      longitude: business?.longitude != null ? String(business.longitude) : "",
    },
    initialId: business?.id ?? "",
    status,
    readOnly,
    toInput,
    create: createBusinessAction,
    update: updateBusinessAction,
    adminPath: "/admin/directorio",
  });

  return (
    <FormProvider {...form}>
      <BusinessBody
        {...{ categories, places, allImages, business, siteName, readOnly, error }}
        publish={
          <PublishPanel
            kind="directory"
            item={{ id, status, scheduledAt: business?.scheduledAt ?? null, reviewNote: business?.reviewNote ?? null }}
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

function BusinessBody({
  categories,
  places,
  allImages,
  business,
  siteName,
  readOnly,
  error,
  publish,
}: Omit<BusinessComposerProps, "permissions"> & { readOnly: boolean; error: string | null; publish: ReactNode }) {
  const coverUrl = useCoverUrl(allImages);
  return (
    <ComposerShell
      error={error}
      readOnlyNotice={readOnly ? "Esta ficha no se puede editar en su estado actual. Puedes verla tal cual está." : null}
      main={
        <>
          <MediaCard allImages={allImages} readOnly={readOnly} />
          <WritingCard
            titleLabel="Nombre"
            titlePlaceholder="Nombre del negocio"
            excerptDefault={business?.excerpt ?? ""}
            allImages={allImages}
            readOnly={readOnly}
          />
          <ContactCard places={places} readOnly={readOnly} />
          <ShareCard
            siteName={siteName}
            path={`/directorio/${business?.slug ?? "…"}`}
            coverUrl={coverUrl}
            metaDescriptionDefault={business?.metaDescription ?? ""}
            readOnly={readOnly}
          />
        </>
      }
      publish={publish}
      aside={
        <>
          <TopicCard title="Tema y tipo" categories={categories} readOnly={readOnly}>
            <Field label="Tipo de negocio" name="businessType">
              <Controller
                name="businessType"
                render={({ field }) => (
                  <Combobox
                    options={BUSINESS_TYPES.map((type) => ({ id: type, label: businessTypeLabel(type) }))}
                    value={field.value}
                    disabled={readOnly}
                    onSelect={(value) => value && field.onChange(value as BusinessType)}
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

function ContactCard({ places, readOnly }: { places: PlaceOption[]; readOnly: boolean }) {
  const { control, register, formState } = useFormContext<Values>();
  const { errors } = formState;
  return (
    <Card title="Contacto y ubicación" description="Se muestran como botones en la ficha: llamar, escribir, sitio web y cómo llegar.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Teléfono" name="phone" error={errors.phone?.message}>
          <TextInput type="tel" inputMode="tel" autoComplete="off" placeholder="+51 999 999 999" disabled={readOnly} {...register("phone")} />
        </Field>
        <Field label="Correo" name="email" error={errors.email?.message}>
          <TextInput type="email" inputMode="email" autoComplete="off" placeholder="hola@negocio.com" disabled={readOnly} {...register("email")} />
        </Field>
      </div>
      <Field label="Sitio web" name="website" error={errors.website?.message}>
        <TextInput type="url" inputMode="url" placeholder="https://…" disabled={readOnly} {...register("website")} />
      </Field>
      <Field label="Dirección" name="address" error={errors.address?.message}>
        <TextInput placeholder="Av. Principal 123, Miraflores" disabled={readOnly} {...register("address")} />
      </Field>
      <Field label="Lugar del sitio (opcional)" name="placeId" hint="Si está dentro de un lugar publicado (un mercado, un centro comercial), enlázalo.">
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
      <LocationFields readOnly={readOnly} />
    </Card>
  );
}

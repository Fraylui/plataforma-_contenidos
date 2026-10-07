"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useState } from "react";
import type { AdminImage, BusinessInput, ContentVideoInput, PlaceOption } from "@/lib/api/admin-types";
import type { Business, BusinessType, Category, ContentImage } from "@/lib/api/types";
import type { PublicationPermissions } from "@/lib/admin/publication";
import { PublishPanel } from "@/components/admin/publish-panel";
import { businessTypeLabel } from "@/lib/content-labels";
import { FormError } from "@/components/admin/ui";
import { Button, Card, CollapsibleCard, Combobox, Field, TextArea, TextInput } from "@/components/ui";
import { ContentImagesPicker } from "./content-images-picker";
import { VideoLinksEditor } from "./video-links-editor";
import { RichTextEditor } from "./rich-text-editor";

// Leaflet toca `window` al montarse — sin SSR, como el resto de los widgets
// solo-cliente de este formulario.
const LocationPicker = dynamic(() => import("./location-picker").then((m) => m.LocationPicker), { ssr: false });
import {
  createBusinessAction,
  updateBusinessAction,
  type ActionResult,
} from "@/app/admin/(protected)/directorio/actions";

const ROBOTS_OPTIONS = ["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"];
const BUSINESS_TYPES: BusinessType[] = ["RESTAURANT", "HOTEL", "SERVICE", "SHOP", "OTHER"];

interface BusinessFormProps {
  categories: Category[];
  places: PlaceOption[];
  allImages: AdminImage[];
  mode: "create" | "edit";
  business?: Business;
  permissions?: PublicationPermissions;
}

export function BusinessForm({
  categories,
  places,
  allImages,
  mode,
  business,
  permissions,
}: BusinessFormProps) {
  const router = useRouter();
  const readOnly = mode === "edit" && permissions !== undefined && !permissions.canEdit;

  const [name, setName] = useState(business?.name ?? "");
  const [excerpt, setExcerpt] = useState(business?.excerpt ?? "");
  const [body, setBody] = useState(business?.body ?? "");
  const [categoryId, setCategoryId] = useState(business?.categoryId ?? categories[0]?.id ?? "");
  const [businessType, setBusinessType] = useState<BusinessType>(business?.businessType ?? "RESTAURANT");
  const [placeId, setPlaceId] = useState<string>(business?.placeId ?? "");
  const [address, setAddress] = useState(business?.address ?? "");
  const [phone, setPhone] = useState(business?.phone ?? "");
  const [email, setEmail] = useState(business?.email ?? "");
  const [website, setWebsite] = useState(business?.website ?? "");
  const [latitude, setLatitude] = useState(business?.latitude != null ? String(business.latitude) : "");
  const [longitude, setLongitude] = useState(business?.longitude != null ? String(business.longitude) : "");
  const [images, setImages] = useState<ContentImage[]>(business?.images ?? []);
  const [seoTitle, setSeoTitle] = useState(business?.seoTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(business?.metaDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(business?.canonicalUrl ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(business?.ogImageUrl ?? "");
  const [videos, setVideos] = useState<ContentVideoInput[]>(
    business?.videos.map((v) => ({
      url: `https://www.youtube.com/watch?v=${v.videoId}`,
      title: v.title,
      caption: v.caption,
    })) ?? [],
  );
  const [robots, setRobots] = useState(business?.robots ?? "index,follow");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildInput(): BusinessInput {
    return {
      name,
      excerpt: excerpt || null,
      body,
      categoryId,
      businessType,
      placeId: placeId || null,
      address: address || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      latitude: latitude.trim() ? Number(latitude) : null,
      longitude: longitude.trim() ? Number(longitude) : null,
      images,
      seoTitle: seoTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      ogImageUrl: ogImageUrl || null,
      videos,
      robots,
    };
  }

  async function handleSubmit() {
    setPending(true);
    setError(null);
    const result =
      mode === "create"
        ? await createBusinessAction(buildInput())
        : await updateBusinessAction(business!.id, buildInput());
    applyResult(result, "Cambios guardados.");
  }

  function applyResult(result: ActionResult, successMessage: string) {
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success(successMessage);
    router.refresh();
  }

  /** Guardado que usa PublishPanel antes de publicar o enviar: devuelve el id, o null si falló. */
  async function save(): Promise<string | null> {
    if (!business) return null;
    setPending(true);
    setError(null);
    const result = await updateBusinessAction(business.id, buildInput());
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return null;
    }
    router.refresh();
    return business.id;
  }

  return (
    <div className="max-w-6xl space-y-6">

      {readOnly && (
        <p className="rounded-control bg-info-soft px-4 py-3 text-sm text-foreground">
          Esta ficha no se puede editar en su estado/rol actual. Puedes seguir viendo el contenido.
        </p>
      )}

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* Columna principal: lo que se escribe */}
        <div className="space-y-6">
          <Card title="Contenido">
            <Field label="Nombre del negocio" name="name">
              <TextInput type="text" value={name} disabled={readOnly} onChange={(e) => setName(e.target.value)} />
            </Field>

            <Field label="Descripción breve (opcional)" name="excerpt">
              <TextArea value={excerpt} disabled={readOnly} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
            </Field>

            <Field label="Descripción completa" name="body">
              <RichTextEditor value={body} onChange={setBody} disabled={readOnly} allImages={allImages} />
            </Field>
          </Card>

          <Card title="Contacto y ubicación">
            <Field label="Lugar vinculado (opcional, si ya existe en Lugares)" name="placeId">
              <Combobox
                options={places.map((place) => ({ id: place.id, label: place.name }))}
                value={placeId || null}
                disabled={readOnly}
                placeholder="Sin lugar (especificar dirección abajo)"
                onSelect={(id) => setPlaceId(id ?? "")}
              />
            </Field>

            <Field label="Dirección (opcional, texto libre)" name="address">
              <TextInput
                type="text"
                value={address}
                disabled={readOnly}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej. Jr. Lima 123, Huamanga"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Teléfono (opcional)" name="phone">
                <TextInput type="tel" value={phone} disabled={readOnly} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field label="Correo (opcional)" name="email">
                <TextInput type="email" value={email} disabled={readOnly} onChange={(e) => setEmail(e.target.value)} />
              </Field>
            </div>

            <Field label="Sitio web (opcional)" name="website">
              <TextInput type="text" value={website} disabled={readOnly} onChange={(e) => setWebsite(e.target.value)} />
            </Field>

            <div>
              <span className="block text-sm font-medium text-foreground">Ubicación (opcional)</span>
              <p className="mt-0.5 text-xs text-muted">Hacé clic en el mapa para ubicar el pin, o escribí las coordenadas a mano.</p>
              <div className="mt-1.5">
                <LocationPicker latitude={latitude} longitude={longitude} disabled={readOnly} onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Latitud (opcional)" name="latitude">
                <TextInput
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                  value={latitude}
                  disabled={readOnly}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-13.04"
                />
              </Field>
              <Field label="Longitud (opcional)" name="longitude">
                <TextInput
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                  value={longitude}
                  disabled={readOnly}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-74.15"
                />
              </Field>
            </div>
          </Card>

          <CollapsibleCard title="SEO">
            <Field label="Título SEO (opcional, si no se define usa el nombre)" name="seoTitle">
              <TextInput type="text" value={seoTitle} disabled={readOnly} onChange={(e) => setSeoTitle(e.target.value)} />
            </Field>
            <Field label="Meta descripción (opcional)" name="metaDescription">
              <TextArea value={metaDescription} disabled={readOnly} onChange={(e) => setMetaDescription(e.target.value)} rows={2} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="URL canónica (opcional)" name="canonicalUrl">
                <TextInput type="text" value={canonicalUrl} disabled={readOnly} onChange={(e) => setCanonicalUrl(e.target.value)} />
              </Field>
              <Field label="Imagen para Open Graph (URL, opcional)" name="ogImageUrl">
                <TextInput type="text" value={ogImageUrl} disabled={readOnly} onChange={(e) => setOgImageUrl(e.target.value)} />
              </Field>
            </div>
            <Field label="Robots" name="robots">
              <Combobox
                options={ROBOTS_OPTIONS.map((option) => ({ id: option, label: option }))}
                value={robots}
                disabled={readOnly}
                onSelect={(id) => id && setRobots(id)}
              />
            </Field>
          </CollapsibleCard>
        </div>

        {/* Barra lateral: publicar + metadata — visible sin scrollear todo el formulario */}
        <div className="space-y-6">
          {error && <FormError message={error} />}
          {mode === "edit" && business && permissions ? (
            <PublishPanel
              kind="directory"
              item={business}
              permissions={permissions}
              dirty={permissions.canEdit}
              saving={pending}
              onSave={save}
            />
          ) : (
            <Card title="Publicar">
              <Button type="submit" size="lg" loading={pending} disabled={!name || !body || !categoryId} onClick={handleSubmit} className="w-full">
                Crear borrador
              </Button>
            </Card>
          )}

          <Card title="Organización">
            <Field label="Tipo de negocio" name="businessType">
              <Combobox
                options={BUSINESS_TYPES.map((type) => ({ id: type, label: businessTypeLabel(type) }))}
                value={businessType}
                disabled={readOnly}
                onSelect={(id) => id && setBusinessType(id as BusinessType)}
              />
            </Field>

            <Field label="Tema" name="categoryId">
              <Combobox
                options={categories.map((category) => ({ id: category.id, label: category.name }))}
                value={categoryId}
                disabled={readOnly}
                onSelect={(id) => id && setCategoryId(id)}
              />
            </Field>
          </Card>

          <Card title="Fotos y videos">
            <Field label="Fotografías (opcional)" name="images">
              <ContentImagesPicker allImages={allImages} value={images} onChange={setImages} disabled={readOnly} />
            </Field>

            <Field label="Videos de YouTube (opcional)" name="videos">
              <VideoLinksEditor value={videos} onChange={setVideos} disabled={readOnly} />
            </Field>
          </Card>
        </div>
      </div>
    </div>
  );
}

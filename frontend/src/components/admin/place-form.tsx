"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useState } from "react";
import type { AdminImage } from "@/lib/api/admin-types";
import type { Category, ContentImage, Place } from "@/lib/api/types";
import type { ContentVideoInput, PlaceInput } from "@/lib/api/admin-types";
import type { PublicationPermissions } from "@/lib/admin/publication";
import { PublishPanel } from "@/components/admin/publish-panel";
import { FormError } from "@/components/admin/ui";
import { Button, Card, CollapsibleCard, Combobox, Field, TextArea, TextInput } from "@/components/ui";
import { ContentImagesPicker } from "./content-images-picker";
import { VideoLinksEditor } from "./video-links-editor";
import { RichTextEditor } from "./rich-text-editor";

const LocationPicker = dynamic(() => import("./location-picker").then((m) => m.LocationPicker), { ssr: false });
import {
  createPlaceAction,
  updatePlaceAction,
  type ActionResult,
} from "@/app/admin/(protected)/lugares/actions";

const ROBOTS_OPTIONS = ["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"];

interface PlaceFormProps {
  categories: Category[];
  allImages: AdminImage[];
  mode: "create" | "edit";
  place?: Place;
  permissions?: PublicationPermissions;
}

export function PlaceForm({ categories, allImages, mode, place, permissions }: PlaceFormProps) {
  const router = useRouter();
  const readOnly = mode === "edit" && permissions !== undefined && !permissions.canEdit;

  const [name, setName] = useState(place?.name ?? "");
  const [excerpt, setExcerpt] = useState(place?.excerpt ?? "");
  const [body, setBody] = useState(place?.body ?? "");
  const [categoryId, setCategoryId] = useState(place?.categoryId ?? categories[0]?.id ?? "");
  const [latitude, setLatitude] = useState(place?.latitude != null ? String(place.latitude) : "");
  const [longitude, setLongitude] = useState(place?.longitude != null ? String(place.longitude) : "");
  const [images, setImages] = useState<ContentImage[]>(place?.images ?? []);
  const [seoTitle, setSeoTitle] = useState(place?.seoTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(place?.metaDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(place?.canonicalUrl ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(place?.ogImageUrl ?? "");
  const [videos, setVideos] = useState<ContentVideoInput[]>(
    place?.videos.map((v) => ({
      url: `https://www.youtube.com/watch?v=${v.videoId}`,
      title: v.title,
      caption: v.caption,
    })) ?? [],
  );
  const [robots, setRobots] = useState(place?.robots ?? "index,follow");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildInput(): PlaceInput {
    return {
      name,
      excerpt: excerpt || null,
      body,
      categoryId,
      latitude: latitude.trim() ? Number(latitude) : null,
      longitude: longitude.trim() ? Number(longitude) : null,
      seoTitle: seoTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      ogImageUrl: ogImageUrl || null,
      images,
      videos,
      robots,
    };
  }

  async function handleSubmit() {
    setPending(true);
    setError(null);
    const result = mode === "create" ? await createPlaceAction(buildInput()) : await updatePlaceAction(place!.id, buildInput());
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
    if (!place) return null;
    setPending(true);
    setError(null);
    const result = await updatePlaceAction(place.id, buildInput());
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return null;
    }
    router.refresh();
    return place.id;
  }

  return (
    <div className="max-w-6xl space-y-6">

      {readOnly && (
        <p className="rounded-control bg-info-soft px-4 py-3 text-sm text-foreground">
          Este lugar no se puede editar en su estado/rol actual. Puedes seguir viendo el contenido.
        </p>
      )}

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* Columna principal: lo que se escribe */}
        <div className="space-y-6">
          <Card title="Contenido">
            <Field label="Nombre" name="name">
              <TextInput type="text" value={name} disabled={readOnly} onChange={(e) => setName(e.target.value)} />
            </Field>

            <Field label="Descripción breve (opcional)" name="excerpt">
              <TextArea value={excerpt} disabled={readOnly} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
            </Field>

            <Field label="Historia / descripción completa" name="body">
              <RichTextEditor value={body} onChange={setBody} disabled={readOnly} allImages={allImages} />
            </Field>
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
          {mode === "edit" && place && permissions ? (
            <PublishPanel
              kind="places"
              item={place}
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

          <Card title="Ubicación">
            <Field label="Tema" name="categoryId">
              <Combobox
                options={categories.map((category) => ({ id: category.id, label: category.name }))}
                value={categoryId}
                disabled={readOnly}
                onSelect={(id) => id && setCategoryId(id)}
              />
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

          <Card title="Fotos y videos">
            <Field label="Fotografías (opcional — la primera es la portada de tarjeta/feed)" name="images">
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

"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useState } from "react";
import type { AdminImage } from "@/lib/api/admin-types";
import type { Category, ContentImage, Place } from "@/lib/api/types";
import type { ContentVideoInput, PlaceInput } from "@/lib/api/admin-types";
import type { PlacePermissions } from "@/lib/admin/place-permissions";
import { articleStatusLabel } from "@/lib/content-labels";
import { ArchiveButton, FormError } from "@/components/admin/ui";
import { Button, Card, CollapsibleCard, Combobox, DateTimeInput, Field, TextArea, TextInput } from "@/components/ui";
import { ContentImagesPicker } from "./content-images-picker";
import { VideoLinksEditor } from "./video-links-editor";
import { RichTextEditor } from "./rich-text-editor";

const LocationPicker = dynamic(() => import("./location-picker").then((m) => m.LocationPicker), { ssr: false });
import {
  approvePlaceAction,
  archivePlaceAction,
  createPlaceAction,
  publishPlaceAction,
  rejectPlaceAction,
  schedulePlaceAction,
  submitPlaceAction,
  updatePlaceAction,
  type ActionResult,
} from "@/app/admin/(protected)/lugares/actions";

const ROBOTS_OPTIONS = ["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"];

interface PlaceFormProps {
  categories: Category[];
  allImages: AdminImage[];
  mode: "create" | "edit";
  place?: Place;
  permissions?: PlacePermissions;
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
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

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

  async function runWorkflow(action: () => Promise<ActionResult>, successMessage: string) {
    setPending(true);
    setError(null);
    const result = await action();
    applyResult(result, successMessage);
  }

  return (
    <div className="max-w-6xl space-y-6">
      {place && (
        <div className="flex flex-wrap items-center gap-3 rounded-card bg-surface px-4 py-3 text-sm shadow-card">
          <span className="font-medium text-foreground">Estado: {articleStatusLabel(place.status)}</span>
          {place.rejectionReason && <span className="text-muted">Motivo de rechazo: {place.rejectionReason}</span>}
        </div>
      )}

      {readOnly && (
        <p className="rounded-md border border-border bg-accent-soft px-4 py-3 text-sm text-accent">
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
          <Card title="Publicar">
            {error && <FormError message={error} />}
            {!readOnly && (
              <Button type="submit" disabled={pending || !name || !body || !categoryId} onClick={handleSubmit} className="w-full">
                {pending ? "Guardando…" : mode === "create" ? "Crear borrador" : "Guardar cambios"}
              </Button>
            )}

            {mode === "edit" && place && permissions && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex flex-wrap gap-2">
                  {permissions.canSubmit && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => submitPlaceAction(place.id), "Enviado a revisión.")}
                    >
                      Enviar a revisión
                    </Button>
                  )}
                  {permissions.canApprove && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => approvePlaceAction(place.id), "Lugar aprobado.")}
                    >
                      Aprobar
                    </Button>
                  )}
                  {permissions.canPublish && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => publishPlaceAction(place.id), "Lugar publicado.")}
                    >
                      Publicar ahora
                    </Button>
                  )}
                  {permissions.canArchive && (
                    <ArchiveButton
                      itemLabel="este lugar"
                      disabled={pending}
                      onConfirm={() => runWorkflow(() => archivePlaceAction(place.id), "Lugar archivado.")}
                    />
                  )}
                </div>

                {permissions.canReject && (
                  <div className="space-y-2">
                    <Field label="Motivo de rechazo" name="rejectReason">
                      <TextInput type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                    </Field>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending || !rejectReason.trim()}
                      onClick={() => runWorkflow(() => rejectPlaceAction(place.id, rejectReason), "Lugar rechazado.")}
                      className="w-full"
                    >
                      Rechazar
                    </Button>
                  </div>
                )}

                {permissions.canSchedule && (
                  <div className="space-y-2">
                    <Field label="Programar publicación para" name="scheduleAt">
                      <DateTimeInput value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
                    </Field>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending || !scheduleAt}
                      onClick={() =>
                        runWorkflow(() => schedulePlaceAction(place.id, new Date(scheduleAt).toISOString()), "Publicación programada.")
                      }
                      className="w-full"
                    >
                      Programar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>

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

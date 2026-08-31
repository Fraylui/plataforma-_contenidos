"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminImage, BusinessInput } from "@/lib/api/admin-types";
import type { Business, BusinessType, Category, GeographicUnit, Place } from "@/lib/api/types";
import type { BusinessPermissions } from "@/lib/admin/business-permissions";
import { articleStatusLabel, businessTypeLabel } from "@/lib/content-labels";
import { AdminButton, FormField, formInputClass } from "@/components/admin/ui";
import { GeographyPicker } from "./geography-picker";
import { PlaceGalleryPicker } from "./place-gallery-picker";
import {
  approveBusinessAction,
  archiveBusinessAction,
  createBusinessAction,
  publishBusinessAction,
  rejectBusinessAction,
  scheduleBusinessAction,
  submitBusinessAction,
  updateBusinessAction,
  type ActionResult,
} from "@/app/admin/(protected)/directorio/actions";

const ROBOTS_OPTIONS = ["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"];
const BUSINESS_TYPES: BusinessType[] = ["RESTAURANT", "HOTEL", "SERVICE", "SHOP", "OTHER"];

interface BusinessFormProps {
  categories: Category[];
  places: Place[];
  allImages: AdminImage[];
  initialGeographyChain: GeographicUnit[];
  mode: "create" | "edit";
  business?: Business;
  permissions?: BusinessPermissions;
}

export function BusinessForm({
  categories,
  places,
  allImages,
  initialGeographyChain,
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
  const [geographyId, setGeographyId] = useState<string | null>(business?.geographyId ?? null);
  const [businessType, setBusinessType] = useState<BusinessType>(business?.businessType ?? "RESTAURANT");
  const [placeId, setPlaceId] = useState<string>(business?.placeId ?? "");
  const [address, setAddress] = useState(business?.address ?? "");
  const [phone, setPhone] = useState(business?.phone ?? "");
  const [email, setEmail] = useState(business?.email ?? "");
  const [website, setWebsite] = useState(business?.website ?? "");
  const [latitude, setLatitude] = useState(business?.latitude != null ? String(business.latitude) : "");
  const [longitude, setLongitude] = useState(business?.longitude != null ? String(business.longitude) : "");
  const [imageIds, setImageIds] = useState<string[]>(business?.imageIds ?? []);
  const [seoTitle, setSeoTitle] = useState(business?.seoTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(business?.metaDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(business?.canonicalUrl ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(business?.ogImageUrl ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [removeYoutube, setRemoveYoutube] = useState(false);
  const [robots, setRobots] = useState(business?.robots ?? "index,follow");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

  function buildInput(): BusinessInput {
    return {
      name,
      excerpt: excerpt || null,
      body,
      categoryId,
      geographyId,
      businessType,
      placeId: placeId || null,
      address: address || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      latitude: latitude.trim() ? Number(latitude) : null,
      longitude: longitude.trim() ? Number(longitude) : null,
      imageIds,
      seoTitle: seoTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      ogImageUrl: ogImageUrl || null,
      youtubeUrl: resolveYoutubeUrlForSubmit(),
      robots,
    };
  }

  /** Mismo motivo que ReviewForm/PlaceForm: el backend reemplaza youtubeVideoId con lo que se mande, vacío incluido. */
  function resolveYoutubeUrlForSubmit(): string | null {
    if (youtubeUrl.trim()) return youtubeUrl;
    if (removeYoutube) return null;
    if (business?.youtubeVideoId) return `https://www.youtube.com/watch?v=${business.youtubeVideoId}`;
    return null;
  }

  async function handleSubmit() {
    setPending(true);
    setError(null);
    setNotice(null);
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
      return;
    }
    setNotice(successMessage);
    router.refresh();
  }

  async function runWorkflow(action: () => Promise<ActionResult>, successMessage: string) {
    setPending(true);
    setError(null);
    setNotice(null);
    const result = await action();
    applyResult(result, successMessage);
  }

  return (
    <div className="max-w-3xl space-y-8">
      {business && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
          <span className="font-medium text-foreground">Estado: {articleStatusLabel(business.status)}</span>
          {business.rejectionReason && (
            <span className="text-muted">Motivo de rechazo: {business.rejectionReason}</span>
          )}
        </div>
      )}

      {readOnly && (
        <p className="rounded-md border border-border bg-accent-soft px-4 py-3 text-sm text-accent">
          Esta ficha no se puede editar en su estado/rol actual. Puedes seguir viendo el contenido.
        </p>
      )}

      <div className="space-y-4">
        <FormField label="Nombre del negocio">
          <input type="text" value={name} disabled={readOnly} onChange={(e) => setName(e.target.value)} className={formInputClass} />
        </FormField>

        <FormField label="Descripción breve (opcional)">
          <textarea value={excerpt} disabled={readOnly} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={formInputClass} />
        </FormField>

        <FormField label="Descripción completa">
          <textarea value={body} disabled={readOnly} onChange={(e) => setBody(e.target.value)} rows={10} className={formInputClass} />
        </FormField>

        <FormField label="Tipo de negocio">
          <select
            value={businessType}
            disabled={readOnly}
            onChange={(e) => setBusinessType(e.target.value as BusinessType)}
            className={formInputClass}
          >
            {BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {businessTypeLabel(type)}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Categoría">
          <select value={categoryId} disabled={readOnly} onChange={(e) => setCategoryId(e.target.value)} className={formInputClass}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Ubicación geográfica (opcional)">
          <GeographyPicker initialChain={initialGeographyChain} onChange={setGeographyId} />
        </FormField>

        <FormField label="Lugar vinculado (opcional, si ya existe en Lugares)">
          <select value={placeId} disabled={readOnly} onChange={(e) => setPlaceId(e.target.value)} className={formInputClass}>
            <option value="">Sin lugar (especificar dirección abajo)</option>
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Dirección (opcional, texto libre)">
          <input
            type="text"
            value={address}
            disabled={readOnly}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ej. Jr. Lima 123, Huamanga"
            className={formInputClass}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Teléfono (opcional)">
            <input type="text" value={phone} disabled={readOnly} onChange={(e) => setPhone(e.target.value)} className={formInputClass} />
          </FormField>
          <FormField label="Correo (opcional)">
            <input type="email" value={email} disabled={readOnly} onChange={(e) => setEmail(e.target.value)} className={formInputClass} />
          </FormField>
        </div>

        <FormField label="Sitio web (opcional)">
          <input type="text" value={website} disabled={readOnly} onChange={(e) => setWebsite(e.target.value)} className={formInputClass} />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Latitud (opcional)">
            <input
              type="number"
              step="any"
              min={-90}
              max={90}
              value={latitude}
              disabled={readOnly}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="-13.04"
              className={formInputClass}
            />
          </FormField>
          <FormField label="Longitud (opcional)">
            <input
              type="number"
              step="any"
              min={-180}
              max={180}
              value={longitude}
              disabled={readOnly}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="-74.15"
              className={formInputClass}
            />
          </FormField>
        </div>

        <FormField label="Fotografías (opcional)">
          <PlaceGalleryPicker allImages={allImages} value={imageIds} onChange={setImageIds} disabled={readOnly} />
        </FormField>

        <FormField label="Video de YouTube (URL, opcional)">
          <input
            type="text"
            value={youtubeUrl}
            disabled={readOnly || removeYoutube}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder={business?.youtubeVideoId ? "Ya tiene un video — pega otra URL para reemplazarlo" : "https://www.youtube.com/watch?v=…"}
            className={formInputClass}
          />
        </FormField>
        {business?.youtubeVideoId && (
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={removeYoutube} disabled={readOnly} onChange={(e) => setRemoveYoutube(e.target.checked)} />
            Quitar el video actual
          </label>
        )}
      </div>

      <fieldset className="space-y-4 border-t border-border pt-6">
        <legend className="text-sm font-medium text-foreground">SEO</legend>
        <FormField label="Título SEO (opcional, si no se define usa el nombre)">
          <input type="text" value={seoTitle} disabled={readOnly} onChange={(e) => setSeoTitle(e.target.value)} className={formInputClass} />
        </FormField>
        <FormField label="Meta descripción (opcional)">
          <textarea value={metaDescription} disabled={readOnly} onChange={(e) => setMetaDescription(e.target.value)} rows={2} className={formInputClass} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="URL canónica (opcional)">
            <input type="text" value={canonicalUrl} disabled={readOnly} onChange={(e) => setCanonicalUrl(e.target.value)} className={formInputClass} />
          </FormField>
          <FormField label="Imagen para Open Graph (URL, opcional)">
            <input type="text" value={ogImageUrl} disabled={readOnly} onChange={(e) => setOgImageUrl(e.target.value)} className={formInputClass} />
          </FormField>
        </div>
        <FormField label="Robots">
          <select value={robots} disabled={readOnly} onChange={(e) => setRobots(e.target.value)} className={formInputClass}>
            {ROBOTS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </FormField>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {notice && <p className="text-sm text-accent">{notice}</p>}

      {!readOnly && (
        <AdminButton
          disabled={pending || !name || !body || !categoryId}
          onClick={handleSubmit}
        >
          {pending ? "Guardando…" : mode === "create" ? "Crear borrador" : "Guardar cambios"}
        </AdminButton>
      )}

      {mode === "edit" && business && permissions && (
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="text-sm font-medium text-foreground">Flujo de publicación</h2>
          <div className="flex flex-wrap gap-2">
            {permissions.canSubmit && (
              <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => runWorkflow(() => submitBusinessAction(business.id), "Enviada a revisión.")}>
                Enviar a revisión
              </AdminButton>
            )}
            {permissions.canApprove && (
              <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => runWorkflow(() => approveBusinessAction(business.id), "Ficha aprobada.")}>
                Aprobar
              </AdminButton>
            )}
            {permissions.canPublish && (
              <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => runWorkflow(() => publishBusinessAction(business.id), "Ficha publicada.")}>
                Publicar ahora
              </AdminButton>
            )}
            {permissions.canArchive && (
              <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => runWorkflow(() => archiveBusinessAction(business.id), "Ficha archivada.")}>
                Archivar
              </AdminButton>
            )}
          </div>

          {permissions.canReject && (
            <div className="flex flex-wrap items-end gap-2">
              <FormField label="Motivo de rechazo">
                <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className={formInputClass} />
              </FormField>
              <AdminButton
                type="button"
                variant="secondary"
                disabled={pending || !rejectReason.trim()}
                onClick={() => runWorkflow(() => rejectBusinessAction(business.id, rejectReason), "Ficha rechazada.")}
              >
                Rechazar
              </AdminButton>
            </div>
          )}

          {permissions.canSchedule && (
            <div className="flex flex-wrap items-end gap-2">
              <FormField label="Programar publicación para">
                <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className={formInputClass} />
              </FormField>
              <AdminButton
                type="button"
                variant="secondary"
                disabled={pending || !scheduleAt}
                onClick={() =>
                  runWorkflow(() => scheduleBusinessAction(business.id, new Date(scheduleAt).toISOString()), "Publicación programada.")
                }
              >
                Programar
              </AdminButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


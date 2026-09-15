"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { AdminImage, BusinessInput } from "@/lib/api/admin-types";
import type { Business, BusinessType, Category, Place } from "@/lib/api/types";
import type { BusinessPermissions } from "@/lib/admin/business-permissions";
import { articleStatusLabel, businessTypeLabel } from "@/lib/content-labels";
import { AdminButton, Combobox, FormField, formInputClass } from "@/components/admin/ui";
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

const CARD_CLASS = "rounded-xl border border-border/60 bg-surface p-5";
const SECTION_TITLE_CLASS = "text-sm font-semibold text-foreground";

/** Grupo con título — misma superficie que el resto del panel (border-border/60, sin shadow). */
function SectionCard({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`${CARD_CLASS} space-y-4 ${className}`}>
      <h2 className={SECTION_TITLE_CLASS}>{title}</h2>
      {children}
    </div>
  );
}

/** Colapsable, cerrado por defecto — para lo avanzado/opcional (SEO) que no debería competir con el contenido principal. */
function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={CARD_CLASS}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between"
      >
        <h2 className={SECTION_TITLE_CLASS}>{title}</h2>
        <ChevronDown className={`h-4 w-4 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && <div className="mt-4 space-y-4">{children}</div>}
    </div>
  );
}

interface BusinessFormProps {
  categories: Category[];
  places: Place[];
  allImages: AdminImage[];
  mode: "create" | "edit";
  business?: Business;
  permissions?: BusinessPermissions;
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
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

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

  async function runWorkflow(action: () => Promise<ActionResult>, successMessage: string) {
    setPending(true);
    setError(null);
    const result = await action();
    applyResult(result, successMessage);
  }

  return (
    <div className="max-w-6xl space-y-6">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* Columna principal: lo que se escribe */}
        <div className="space-y-6">
          <SectionCard title="Contenido">
            <FormField label="Nombre del negocio" name="name">
              <input type="text" value={name} disabled={readOnly} onChange={(e) => setName(e.target.value)} className={formInputClass} />
            </FormField>

            <FormField label="Descripción breve (opcional)" name="excerpt">
              <textarea value={excerpt} disabled={readOnly} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={formInputClass} />
            </FormField>

            <FormField label="Descripción completa" name="body">
              <textarea value={body} disabled={readOnly} onChange={(e) => setBody(e.target.value)} rows={10} className={formInputClass} />
            </FormField>
          </SectionCard>

          <SectionCard title="Contacto y ubicación">
            <FormField label="Lugar vinculado (opcional, si ya existe en Lugares)" name="placeId">
              <Combobox
                options={places.map((place) => ({ id: place.id, label: place.name }))}
                value={placeId || null}
                disabled={readOnly}
                placeholder="Sin lugar (especificar dirección abajo)"
                onSelect={(id) => setPlaceId(id ?? "")}
              />
            </FormField>

            <FormField label="Dirección (opcional, texto libre)" name="address">
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
              <FormField label="Teléfono (opcional)" name="phone">
                <input type="text" value={phone} disabled={readOnly} onChange={(e) => setPhone(e.target.value)} className={formInputClass} />
              </FormField>
              <FormField label="Correo (opcional)" name="email">
                <input type="email" value={email} disabled={readOnly} onChange={(e) => setEmail(e.target.value)} className={formInputClass} />
              </FormField>
            </div>

            <FormField label="Sitio web (opcional)" name="website">
              <input type="text" value={website} disabled={readOnly} onChange={(e) => setWebsite(e.target.value)} className={formInputClass} />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Latitud (opcional)" name="latitude">
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
              <FormField label="Longitud (opcional)" name="longitude">
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
          </SectionCard>

          <CollapsibleSection title="SEO">
            <FormField label="Título SEO (opcional, si no se define usa el nombre)" name="seoTitle">
              <input type="text" value={seoTitle} disabled={readOnly} onChange={(e) => setSeoTitle(e.target.value)} className={formInputClass} />
            </FormField>
            <FormField label="Meta descripción (opcional)" name="metaDescription">
              <textarea value={metaDescription} disabled={readOnly} onChange={(e) => setMetaDescription(e.target.value)} rows={2} className={formInputClass} />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="URL canónica (opcional)" name="canonicalUrl">
                <input type="text" value={canonicalUrl} disabled={readOnly} onChange={(e) => setCanonicalUrl(e.target.value)} className={formInputClass} />
              </FormField>
              <FormField label="Imagen para Open Graph (URL, opcional)" name="ogImageUrl">
                <input type="text" value={ogImageUrl} disabled={readOnly} onChange={(e) => setOgImageUrl(e.target.value)} className={formInputClass} />
              </FormField>
            </div>
            <FormField label="Robots" name="robots">
              <Combobox
                options={ROBOTS_OPTIONS.map((option) => ({ id: option, label: option }))}
                value={robots}
                disabled={readOnly}
                onSelect={(id) => id && setRobots(id)}
              />
            </FormField>
          </CollapsibleSection>
        </div>

        {/* Barra lateral: publicar + metadata — visible sin scrollear todo el formulario */}
        <div className="space-y-6">
          <SectionCard title="Publicar">
            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            {!readOnly && (
              <AdminButton disabled={pending || !name || !body || !categoryId} onClick={handleSubmit} className="w-full">
                {pending ? "Guardando…" : mode === "create" ? "Crear borrador" : "Guardar cambios"}
              </AdminButton>
            )}

            {mode === "edit" && business && permissions && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex flex-wrap gap-2">
                  {permissions.canSubmit && (
                    <AdminButton
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => submitBusinessAction(business.id), "Enviada a revisión.")}
                    >
                      Enviar a revisión
                    </AdminButton>
                  )}
                  {permissions.canApprove && (
                    <AdminButton
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => approveBusinessAction(business.id), "Ficha aprobada.")}
                    >
                      Aprobar
                    </AdminButton>
                  )}
                  {permissions.canPublish && (
                    <AdminButton
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => publishBusinessAction(business.id), "Ficha publicada.")}
                    >
                      Publicar ahora
                    </AdminButton>
                  )}
                  {permissions.canArchive && (
                    <AdminButton
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runWorkflow(() => archiveBusinessAction(business.id), "Ficha archivada.")}
                    >
                      Archivar
                    </AdminButton>
                  )}
                </div>

                {permissions.canReject && (
                  <div className="space-y-2">
                    <FormField label="Motivo de rechazo" name="rejectReason">
                      <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className={formInputClass} />
                    </FormField>
                    <AdminButton
                      type="button"
                      variant="secondary"
                      disabled={pending || !rejectReason.trim()}
                      onClick={() => runWorkflow(() => rejectBusinessAction(business.id, rejectReason), "Ficha rechazada.")}
                      className="w-full"
                    >
                      Rechazar
                    </AdminButton>
                  </div>
                )}

                {permissions.canSchedule && (
                  <div className="space-y-2">
                    <FormField label="Programar publicación para" name="scheduleAt">
                      <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className={formInputClass} />
                    </FormField>
                    <AdminButton
                      type="button"
                      variant="secondary"
                      disabled={pending || !scheduleAt}
                      onClick={() =>
                        runWorkflow(() => scheduleBusinessAction(business.id, new Date(scheduleAt).toISOString()), "Publicación programada.")
                      }
                      className="w-full"
                    >
                      Programar
                    </AdminButton>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Organización">
            <FormField label="Tipo de negocio" name="businessType">
              <Combobox
                options={BUSINESS_TYPES.map((type) => ({ id: type, label: businessTypeLabel(type) }))}
                value={businessType}
                disabled={readOnly}
                onSelect={(id) => id && setBusinessType(id as BusinessType)}
              />
            </FormField>

            <FormField label="Categoría" name="categoryId">
              <Combobox
                options={categories.map((category) => ({ id: category.id, label: category.name }))}
                value={categoryId}
                disabled={readOnly}
                onSelect={(id) => id && setCategoryId(id)}
              />
            </FormField>
          </SectionCard>

          <SectionCard title="Medios">
            <FormField label="Fotografías (opcional)" name="imageIds">
              <PlaceGalleryPicker allImages={allImages} value={imageIds} onChange={setImageIds} disabled={readOnly} />
            </FormField>

            <FormField label="Video de YouTube (URL, opcional)" name="youtubeUrl">
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
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

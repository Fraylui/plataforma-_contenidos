"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AdminImage, AdvertiserIndustry, Campaign } from "@/lib/api/admin-types";
import type { AdPlacement, CallToAction, CampaignFormat, Category, ResolvedCampaign } from "@/lib/api/types";
import { CampaignTargetingFields, splitList } from "@/components/admin/campaign-targeting-fields";
import { creativeFit, formatSize } from "@/lib/ads/ad-formats";
import { CALL_TO_ACTIONS } from "@/lib/ads/call-to-action";
import { industryWarning } from "@/lib/ads/industry";
import { nativePhotoFit, NATIVE_PHOTO_MIN_WIDTH, videoAspect, youtubeVideoId } from "@/lib/ads/native-media";
import { imageUrl } from "@/lib/image-url";
import {
  createCampaignAction,
  updateCampaignAction,
  type ActionResult,
} from "@/app/admin/(protected)/anunciantes/actions";
import { FormError } from "@/components/admin/ui";
import { Button, Checkbox, Combobox, DateTimeInput, Field, TextArea, TextInput } from "@/components/ui";
import { IndustryWarningNotice } from "@/components/admin/industry-warning";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CampaignCreativePicker } from "@/components/admin/campaign-creative-picker";
import { NativeAdPost } from "@/components/post/native-ad-post";

/** ISO (UTC) -> valor local para <input type="datetime-local"> — mismo helper que EventForm. */
function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Medida real de la creatividad elegida, cargándola en el navegador (sirve
 * igual para una subida que para un enlace externo, que el backend no puede
 * medir sin descargarlo). null mientras carga o si no hay imagen.
 */
function useImageSize(src: string | null): { width: number; height: number } | null {
  const [size, setSize] = useState<{ src: string; width: number; height: number } | null>(null);
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (!cancelled) setSize({ src, width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);
  return size && size.src === src ? size : null;
}

const FORMAT_OPTIONS: { value: CampaignFormat; label: string }[] = [
  { value: "NATIVE", label: "Post en el feed" },
  { value: "BANNER", label: "Banner" },
];

type NativeMedia = "PHOTO" | "VIDEO";
const MEDIA_OPTIONS: { value: NativeMedia; label: string }[] = [
  { value: "PHOTO", label: "Foto" },
  { value: "VIDEO", label: "Video de YouTube" },
];

const TEXT_MAX = 500;
const HEADLINE_MAX = 60;

interface CampaignFormProps {
  mode: "create" | "edit";
  advertiserId: string;
  /** Para la vista previa del post: como lo verá el visitante. */
  advertiserName: string;
  advertiserLogoImageId: string | null;
  /** Rubro del anunciante: si es regulado, el formulario recuerda su advertencia obligatoria. */
  advertiserIndustry: AdvertiserIndustry;
  placements: AdPlacement[];
  categories: Category[];
  allImages: AdminImage[];
  campaign?: Campaign;
}

/**
 * Campaña de publicidad directa en dos formatos (spec 2026-10-16):
 * «Post en el feed» (anuncio nativo como en Instagram/Facebook, con vista
 * previa en vivo, igual que el Administrador de anuncios de Meta) o
 * «Banner» a la medida de una posición.
 */
export function CampaignForm({
  mode,
  advertiserId,
  advertiserName,
  advertiserLogoImageId,
  advertiserIndustry,
  placements,
  categories,
  allImages,
  campaign,
}: CampaignFormProps) {
  const [format, setFormat] = useState<CampaignFormat>(campaign?.format ?? "NATIVE");
  const [placementKey, setPlacementKey] = useState<string | null>(
    campaign?.format === "BANNER" ? campaign.placementKey : null,
  );
  const [creative, setCreative] = useState({
    imageId: campaign?.imageId ?? null,
    externalImageUrl: campaign?.externalImageUrl ?? null,
    imageAlt: campaign?.imageAlt ?? null,
  });
  const [images, setImages] = useState(allImages);
  const [media, setMedia] = useState<NativeMedia>(campaign?.youtubeVideoId ? "VIDEO" : "PHOTO");
  const [videoUrl, setVideoUrl] = useState(
    campaign?.youtubeVideoId ? `https://www.youtube.com/watch?v=${campaign.youtubeVideoId}` : "",
  );
  const [primaryText, setPrimaryText] = useState(campaign?.primaryText ?? "");
  const [headline, setHeadline] = useState(campaign?.headline ?? "");
  const [callToAction, setCallToAction] = useState<CallToAction>(campaign?.callToAction ?? "LEARN_MORE");
  const [linkUrl, setLinkUrl] = useState(campaign?.linkUrl ?? "");
  const [startsAt, setStartsAt] = useState(campaign?.startsAt ? toDatetimeLocalValue(campaign.startsAt) : "");
  const [endsAt, setEndsAt] = useState(campaign?.endsAt ? toDatetimeLocalValue(campaign.endsAt) : "");
  const [amount, setAmount] = useState(campaign?.amount != null ? String(campaign.amount) : "");
  const [currency, setCurrency] = useState(campaign?.currency ?? "PEN");
  const [weight, setWeight] = useState(campaign?.weight ?? 5);
  const [targeting, setTargeting] = useState({
    sections: campaign?.targetSections ?? [],
    categoryIds: campaign?.targetCategoryIds ?? [],
    countries: (campaign?.targetCountries ?? []).join(", "),
    regions: (campaign?.targetRegions ?? []).join(", "),
  });
  // Se confirma en cada guardado (D.L. 1044, art. 17.3.f): la confirmación vale para esta versión del anuncio.
  const [complianceConfirmed, setComplianceConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNative = format === "NATIVE";

  // Banner: medida de la posición.
  const placementOptions = placements.map((p) => ({ id: p.key, label: `${p.label} — ${formatSize(p.width, p.height)}` }));
  const placement = placements.find((p) => p.key === placementKey) ?? null;
  const creativeSrc = creative.imageId
    ? imageUrl(`/api/v1/images/${creative.imageId}/file`)
    : creative.externalImageUrl;
  const creativeSize = useImageSize(creativeSrc);
  const fit = placement && creativeSize
    ? creativeFit(creativeSize.width, creativeSize.height, placement.width, placement.height)
    : null;

  // Nativo: foto de la biblioteca con proporción de feed, o video de YouTube.
  const photo = creative.imageId ? images.find((i) => i.id === creative.imageId) ?? null : null;
  const photoFit = photo ? nativePhotoFit(photo.width, photo.height) : null;
  const videoId = videoUrl.trim() ? youtubeVideoId(videoUrl.trim()) : null;
  const nativeMediaOk = media === "VIDEO" ? Boolean(videoId) : photoFit?.ok === true;

  const hasCreative = Boolean(creative.imageId || creative.externalImageUrl);
  const canSubmit =
    complianceConfirmed &&
    (isNative
      ? Boolean(primaryText.trim() && linkUrl.trim() && nativeMediaOk)
      : Boolean(placementKey && hasCreative && linkUrl.trim() && fit?.ok !== false));

  const preview: ResolvedCampaign = {
    id: campaign?.id ?? "vista-previa",
    advertiserId,
    format: "NATIVE",
    imageSrc: media === "PHOTO" && photo ? imageUrl(photo.url) : null,
    externalImageUrl: null,
    imageAlt: creative.imageAlt,
    advertiserName,
    advertiserLogoSrc: advertiserLogoImageId ? imageUrl(`/api/v1/images/${advertiserLogoImageId}/file`) : null,
    primaryText: primaryText.trim() || "El texto del anuncio aparece aquí.",
    headline: headline.trim() || null,
    callToAction,
    displayDomain: displayDomain(linkUrl),
    youtubeVideoId: media === "VIDEO" ? videoId : null,
    mediaAspect: media === "VIDEO" ? videoAspect(videoUrl) : photoFit?.ok ? photoFit.aspect : "1:1",
  };

  async function handleSubmit() {
    setPending(true);
    setError(null);
    const nativePhoto = isNative && media === "PHOTO";
    const input = {
      advertiserId,
      format,
      placementKey: isNative ? null : placementKey!,
      imageId: isNative ? (nativePhoto ? creative.imageId : null) : creative.imageId,
      externalImageUrl: isNative ? null : creative.externalImageUrl,
      imageAlt: isNative && !nativePhoto ? null : creative.imageAlt,
      videoUrl: isNative && media === "VIDEO" ? videoUrl.trim() : null,
      primaryText: isNative ? primaryText.trim() : null,
      headline: isNative ? headline.trim() || null : null,
      callToAction: isNative ? callToAction : null,
      linkUrl: linkUrl.trim(),
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      amount: amount.trim() ? Number(amount) : null,
      currency: amount.trim() ? currency.trim().toUpperCase() || null : null,
      weight,
      targetSections: targeting.sections,
      targetCategoryIds: targeting.categoryIds,
      targetCountries: splitList(targeting.countries).map((c) => c.toUpperCase()),
      targetRegions: splitList(targeting.regions),
      complianceConfirmed,
    };
    const result: ActionResult =
      mode === "create"
        ? await createCampaignAction(advertiserId, input)
        : await updateCampaignAction(advertiserId, campaign!.id, input);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Guardado.");
  }

  return (
    <div className={isNative ? "grid max-w-5xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]" : "max-w-xl"}>
      <div className="space-y-4 rounded-card bg-surface p-5 shadow-card">
        <FieldGroup label="Formato">
          <SegmentedControl label="Formato" options={FORMAT_OPTIONS} value={format} onChange={setFormat} />
          <p className="mt-2 text-xs text-muted">
            {isNative
              ? "Sale en el feed como un post más, con el logo y el nombre del anunciante, como en Instagram y Facebook."
              : "Imagen a la medida exacta de un espacio (lateral, cabecera, barra inferior…)."}
          </p>
        </FieldGroup>

        {isNative ? (
          <>
            <Field label="Texto del anuncio" name="primaryText" hint="Las primeras ~125 letras se ven siempre; el resto queda tras «más».">
              <TextArea
                value={primaryText}
                onChange={(e) => setPrimaryText(e.target.value)}
                maxLength={TEXT_MAX}
                rows={4}
                placeholder="2x1 los martes en todo el menú. Pide por WhatsApp y recoge en 20 minutos."
              />
            </Field>

            <FieldGroup label="Foto o video">
              <SegmentedControl label="Foto o video" options={MEDIA_OPTIONS} value={media} onChange={setMedia} />
              <div className="mt-3">
                {media === "PHOTO" ? (
                  <>
                    <p className="mb-2 text-xs text-muted">
                      Cuadrada (1080×1080), vertical 4:5 (1080×1350) u horizontal (1200×628). Se muestra a todo el ancho del post.
                    </p>
                    <CampaignCreativePicker
                      allImages={images}
                      value={{ ...creative, externalImageUrl: null }}
                      onChange={setCreative}
                      onImagesChange={setImages}
                      allowExternal={false}
                      previewClassName="aspect-square w-40"
                    />
                    {photo && photoFit && (
                      <p role="status" className={`mt-2 text-xs ${photoFit.ok ? "text-accent" : "text-danger-ink"}`}>
                        {photoFit.ok
                          ? `La foto mide ${formatSize(photo.width, photo.height)}: proporción ${photoFit.aspect}, correcta para el feed.`
                          : photoFit.reason === "aspect"
                            ? `La foto mide ${formatSize(photo.width, photo.height)}: no es cuadrada, 4:5 ni horizontal 1.91:1.`
                            : `La foto mide ${photo.width} px de ancho: necesita al menos ${NATIVE_PHOTO_MIN_WIDTH} (mejor 1080).`}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <TextInput
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=… o un Short"
                      aria-label="Link del video de YouTube"
                    />
                    <p role="status" className={`mt-2 text-xs ${videoUrl.trim() && !videoId ? "text-danger-ink" : "text-muted"}`}>
                      {videoUrl.trim() && !videoId
                        ? "Ese link no es de un video de YouTube."
                        : "El video vive en el YouTube del anunciante; aquí solo se enlaza. Carga cuando el visitante lo toca."}
                    </p>
                  </>
                )}
              </div>
            </FieldGroup>

            <Field label="Titular (opcional)" name="headline">
              <TextInput
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={HEADLINE_MAX}
                placeholder="Pollo a la brasa con papas"
              />
            </Field>

            <Field label="Botón" name="callToAction">
              <Combobox
                options={CALL_TO_ACTIONS.map((c) => ({ id: c.value, label: c.label }))}
                value={callToAction}
                onSelect={(v) => v && setCallToAction(v as CallToAction)}
                placeholder="Elegir botón…"
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Posición" name="placementKey">
              <Combobox
                options={placementOptions}
                value={placementKey}
                onSelect={setPlacementKey}
                placeholder="Elegir posición…"
              />
            </Field>

            <FieldGroup label="Creatividad (imagen subida o por enlace externo)">
              {placement && (
                <p className="mb-2 text-xs text-muted">
                  Diseño del anunciante a <strong className="text-foreground">{formatSize(placement.width, placement.height)} px</strong>
                  {" "}(mejor al doble, {formatSize(placement.width * 2, placement.height * 2)}, para pantallas nítidas). Se muestra
                  entera, con su marca y mensaje: el sitio solo le agrega la etiqueta «Publicidad».
                </p>
              )}
              <CampaignCreativePicker allImages={images} value={creative} onChange={setCreative} onImagesChange={setImages} />
              {placement && creativeSize && fit && (
                <p role="status" className={`mt-2 text-xs ${fit.ok ? "text-accent" : "text-danger-ink"}`}>
                  {fit.ok
                    ? `La imagen mide ${formatSize(creativeSize.width, creativeSize.height)}: medida correcta${fit.retina ? " y nítida en pantallas de alta densidad" : " (al doble se vería más nítida)"}.`
                    : fit.reason === "aspect"
                      ? `La imagen mide ${formatSize(creativeSize.width, creativeSize.height)} y no tiene la proporción de ${formatSize(placement.width, placement.height)}: pide al anunciante el banner a esa medida.`
                      : `La imagen mide ${formatSize(creativeSize.width, creativeSize.height)}, más chica que ${formatSize(placement.width, placement.height)}: se vería borrosa.`}
                </p>
              )}
            </FieldGroup>
          </>
        )}

        <Field label="Link de destino (a dónde va la persona al tocar el anuncio)" name="linkUrl">
          <TextInput
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder={isNative && callToAction === "WHATSAPP" ? "https://wa.me/51999999999" : "https://…"}
          />
        </Field>

        <CampaignTargetingFields value={targeting} onChange={setTargeting} categories={categories} />

        <FieldGroup label="Peso de rotación (1–10): con varias campañas en la misma posición, cuánto más seguido sale esta">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
              aria-valuetext={`Peso ${weight}`}
            />
            <span className="w-8 text-right text-sm font-semibold tabular-nums text-foreground">{weight}</span>
          </div>
          <p className="mt-1 text-xs text-muted">5 es lo normal; 10 sale el doble de veces que una de 5. Sola en su posición, el peso no cambia nada.</p>
        </FieldGroup>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Empieza (opcional, corre desde ya si se deja vacío)" name="startsAt">
            <DateTimeInput value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </Field>
          <Field label="Termina (opcional, indefinida si se deja vacío)" name="endsAt">
            <DateTimeInput value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-[1fr_100px] gap-4">
          <Field label="Monto cobrado (opcional — solo registro, sin facturación)" name="amount">
            <TextInput
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </Field>
          <Field label="Moneda" name="currency">
            <TextInput
              type="text"
              value={currency}
              disabled={!amount.trim()}
              onChange={(e) => setCurrency(e.target.value)}
              maxLength={3}
              className="uppercase"
            />
          </Field>
        </div>

        <FieldGroup label="Antes de publicar">
          <div className="space-y-3">
            <IndustryWarningNotice industry={advertiserIndustry} />
            <Checkbox
              checked={complianceConfirmed}
              onChange={(e) => setComplianceConfirmed(e.target.checked)}
              label="El anuncio muestra la vigencia, el stock y las condiciones de la oferta"
              description={
                industryWarning(advertiserIndustry)
                  ? "Y lleva la advertencia obligatoria de arriba. Lo exige la ley de publicidad (D.L. 1044); se confirma en cada guardado."
                  : "Si anuncia una promoción, descuento o regalo, lo exige la ley de publicidad (D.L. 1044); se confirma en cada guardado."
              }
            />
          </div>
        </FieldGroup>

        {error && <FormError message={error} />}
        <Button type="submit" disabled={pending || !canSubmit} onClick={handleSubmit}>
          {pending ? "Guardando…" : mode === "create" ? "Crear campaña" : "Guardar cambios"}
        </Button>
      </div>

      {isNative && (
        <aside aria-label="Vista previa" className="lg:sticky lg:top-20">
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Así se verá en el feed</p>
          <div className="overflow-hidden rounded-card bg-canvas p-3">
            <NativeAdPost campaign={preview} preview />
          </div>
        </aside>
      )}
    </div>
  );
}

/** Grupo de controles con título (radios, selector de imagen): un fieldset, no una etiqueta que envuelva varios controles. */
function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 block text-label font-medium text-foreground">{label}</legend>
      {children}
    </fieldset>
  );
}

/** Dominio para la barra de la vista previa (el servidor calcula el real con la misma regla). */
function displayDomain(url: string): string | null {
  try {
    return new URL(url.trim()).hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AdminImage, Campaign } from "@/lib/api/admin-types";
import type { AdPlacement } from "@/lib/api/types";
import { creativeFit, formatSize } from "@/lib/ads/ad-formats";
import { imageUrl } from "@/lib/image-url";
import {
  createCampaignAction,
  updateCampaignAction,
  type ActionResult,
} from "@/app/admin/(protected)/anunciantes/actions";
import { AdminButton, Combobox, FormError, FormField, formInputClass } from "@/components/admin/ui";
import { CampaignCreativePicker } from "@/components/admin/campaign-creative-picker";

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

interface CampaignFormProps {
  mode: "create" | "edit";
  advertiserId: string;
  placements: AdPlacement[];
  allImages: AdminImage[];
  campaign?: Campaign;
}

export function CampaignForm({ mode, advertiserId, placements, allImages, campaign }: CampaignFormProps) {
  const [placementKey, setPlacementKey] = useState<string | null>(campaign?.placementKey ?? null);
  const [creative, setCreative] = useState({
    imageId: campaign?.imageId ?? null,
    externalImageUrl: campaign?.externalImageUrl ?? null,
    imageAlt: campaign?.imageAlt ?? null,
  });
  const [linkUrl, setLinkUrl] = useState(campaign?.linkUrl ?? "");
  const [startsAt, setStartsAt] = useState(campaign?.startsAt ? toDatetimeLocalValue(campaign.startsAt) : "");
  const [endsAt, setEndsAt] = useState(campaign?.endsAt ? toDatetimeLocalValue(campaign.endsAt) : "");
  const [amount, setAmount] = useState(campaign?.amount != null ? String(campaign.amount) : "");
  const [currency, setCurrency] = useState(campaign?.currency ?? "PEN");
  const [weight, setWeight] = useState(campaign?.weight ?? 5);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placementOptions = placements.map((p) => ({ id: p.key, label: `${p.label} — ${formatSize(p.width, p.height)}` }));
  const placement = placements.find((p) => p.key === placementKey) ?? null;
  const creativeSrc = creative.imageId
    ? imageUrl(`/api/v1/images/${creative.imageId}/file`)
    : creative.externalImageUrl;
  const creativeSize = useImageSize(creativeSrc);
  const fit = placement && creativeSize
    ? creativeFit(creativeSize.width, creativeSize.height, placement.width, placement.height)
    : null;

  const hasCreative = Boolean(creative.imageId || creative.externalImageUrl);
  const canSubmit = Boolean(placementKey) && hasCreative && linkUrl.trim() && fit?.ok !== false;

  async function handleSubmit() {
    setPending(true);
    setError(null);
    const input = {
      advertiserId,
      placementKey: placementKey!,
      imageId: creative.imageId,
      externalImageUrl: creative.externalImageUrl,
      imageAlt: creative.imageAlt,
      linkUrl: linkUrl.trim(),
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      amount: amount.trim() ? Number(amount) : null,
      currency: amount.trim() ? currency.trim().toUpperCase() || null : null,
      weight,
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
    <div className="max-w-xl space-y-4 rounded-xl border border-border/60 bg-surface p-5">
      <FormField label="Posición" name="placementKey">
        <Combobox
          options={placementOptions}
          value={placementKey}
          onSelect={setPlacementKey}
          placeholder="Elegir posición…"
        />
      </FormField>

      <FormField label="Creatividad (imagen subida o por enlace externo)" name="creative">
        {placement && (
          <p className="mb-2 text-xs text-muted">
            Diseño del anunciante a <strong className="text-foreground">{formatSize(placement.width, placement.height)} px</strong>
            {" "}(mejor al doble, {formatSize(placement.width * 2, placement.height * 2)}, para pantallas nítidas). Se muestra
            entera, con su marca y mensaje: el sitio solo le agrega la etiqueta «Publicidad».
          </p>
        )}
        <CampaignCreativePicker allImages={allImages} value={creative} onChange={setCreative} />
        {placement && creativeSize && fit && (
          <p role="status" className={`mt-2 text-xs ${fit.ok ? "text-accent" : "text-red-600"}`}>
            {fit.ok
              ? `La imagen mide ${formatSize(creativeSize.width, creativeSize.height)}: medida correcta${fit.retina ? " y nítida en pantallas de alta densidad" : " (al doble se vería más nítida)"}.`
              : fit.reason === "aspect"
                ? `La imagen mide ${formatSize(creativeSize.width, creativeSize.height)} y no tiene la proporción de ${formatSize(placement.width, placement.height)}: pide al anunciante el banner a esa medida.`
                : `La imagen mide ${formatSize(creativeSize.width, creativeSize.height)}, más chica que ${formatSize(placement.width, placement.height)}: se vería borrosa.`}
          </p>
        )}
      </FormField>

      <FormField label="Link de destino (a dónde va el lector al hacer clic)" name="linkUrl">
        <input
          type="text"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://…"
          className={formInputClass}
        />
      </FormField>

      <FormField label="Peso de rotación (1–10): con varias campañas en la misma posición, cuánto más seguido sale esta" name="weight">
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
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Empieza (opcional, corre desde ya si se deja vacío)" name="startsAt">
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={formInputClass} />
        </FormField>
        <FormField label="Termina (opcional, indefinida si se deja vacío)" name="endsAt">
          <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={formInputClass} />
        </FormField>
      </div>

      <div className="grid grid-cols-[1fr_100px] gap-4">
        <FormField label="Monto cobrado (opcional — solo registro, sin facturación)" name="amount">
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={formInputClass}
          />
        </FormField>
        <FormField label="Moneda" name="currency">
          <input
            type="text"
            value={currency}
            disabled={!amount.trim()}
            onChange={(e) => setCurrency(e.target.value)}
            maxLength={3}
            className={`${formInputClass} uppercase`}
          />
        </FormField>
      </div>

      {error && <FormError message={error} />}
      <AdminButton disabled={pending || !canSubmit} onClick={handleSubmit}>
        {pending ? "Guardando…" : mode === "create" ? "Crear campaña" : "Guardar cambios"}
      </AdminButton>
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { AdminImage, Campaign } from "@/lib/api/admin-types";
import {
  createCampaignAction,
  updateCampaignAction,
  type ActionResult,
} from "@/app/admin/(protected)/anunciantes/actions";
import { AdminButton, Combobox, FormField, formInputClass, type ComboboxOption } from "@/components/admin/ui";
import { CampaignCreativePicker } from "@/components/admin/campaign-creative-picker";

/** ISO (UTC) -> valor local para <input type="datetime-local"> — mismo helper que EventForm. */
function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface CampaignFormProps {
  mode: "create" | "edit";
  advertiserId: string;
  placementOptions: ComboboxOption[];
  allImages: AdminImage[];
  campaign?: Campaign;
}

export function CampaignForm({ mode, advertiserId, placementOptions, allImages, campaign }: CampaignFormProps) {
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCreative = Boolean(creative.imageId || creative.externalImageUrl);
  const canSubmit = Boolean(placementKey) && hasCreative && linkUrl.trim();

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
        <CampaignCreativePicker allImages={allImages} value={creative} onChange={setCreative} />
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

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <AdminButton disabled={pending || !canSubmit} onClick={handleSubmit}>
        {pending ? "Guardando…" : mode === "create" ? "Crear campaña" : "Guardar cambios"}
      </AdminButton>
    </div>
  );
}

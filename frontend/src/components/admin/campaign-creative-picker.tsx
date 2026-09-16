"use client";

import { useState } from "react";
import { Link as LinkIcon, X } from "lucide-react";
import type { AdminImage } from "@/lib/api/admin-types";
import { imageUrl } from "@/lib/image-url";
import { FormField, formInputClass } from "@/components/admin/ui";
import { InlineImageUpload } from "./inline-image-upload";

export interface CampaignCreativeValue {
  imageId: string | null;
  externalImageUrl: string | null;
  imageAlt: string | null;
}

/**
 * Selector de la creatividad de una campaña: exactamente una imagen, subida
 * o por enlace externo (mismo XOR que ContentImage, pero un solo ítem, no
 * una galería — ver CampaignCreativePicker en el plan). A diferencia de
 * ContentImagesPicker (múltiples, orden de selección), acá elegir otra
 * reemplaza a la anterior.
 */
export function CampaignCreativePicker({
  allImages,
  value,
  onChange,
  disabled,
}: {
  allImages: AdminImage[];
  value: CampaignCreativeValue;
  onChange: (value: CampaignCreativeValue) => void;
  disabled?: boolean;
}) {
  const [images, setImages] = useState(allImages);
  const [externalUrlDraft, setExternalUrlDraft] = useState(value.externalImageUrl ?? "");

  function selectUploaded(imageId: string) {
    if (disabled) return;
    onChange({ imageId, externalImageUrl: null, imageAlt: value.imageAlt });
  }

  function handleUploaded(image: AdminImage) {
    setImages((prev) => [image, ...prev]);
    setExternalUrlDraft("");
    onChange({ imageId: image.id, externalImageUrl: null, imageAlt: value.imageAlt });
  }

  function applyExternalUrl() {
    const url = externalUrlDraft.trim();
    if (!url) return;
    onChange({ imageId: null, externalImageUrl: url, imageAlt: value.imageAlt });
  }

  function clear() {
    setExternalUrlDraft("");
    onChange({ imageId: null, externalImageUrl: null, imageAlt: value.imageAlt });
  }

  const previewSrc = value.imageId
    ? imageUrl(images.find((i) => i.id === value.imageId)?.url ?? "")
    : value.externalImageUrl;

  return (
    <div className="space-y-3">
      {previewSrc && (
        <div className="relative aspect-[3/1] w-full max-w-sm overflow-hidden rounded-md border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element -- previsualización, host puede ser externo */}
          <img src={previewSrc} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Quitar imagen"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted" htmlFor="campaign-creative-external-url">
            Por enlace externo (lo que suele enviar el anunciante)
          </label>
          <input
            id="campaign-creative-external-url"
            type="text"
            value={externalUrlDraft}
            disabled={disabled}
            onChange={(e) => setExternalUrlDraft(e.target.value)}
            placeholder="https://…"
            className={formInputClass}
          />
        </div>
        <button
          type="button"
          disabled={disabled || !externalUrlDraft.trim()}
          onClick={applyExternalUrl}
          className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent-soft hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LinkIcon className="h-4 w-4" aria-hidden="true" />
          Usar
        </button>
      </div>

      <InlineImageUpload disabled={disabled} onUploaded={handleUploaded} compact />

      {images.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted">O elegir una ya subida</p>
          <div className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
            {images.map((image) => (
              <button
                key={image.id}
                type="button"
                disabled={disabled}
                onClick={() => selectUploaded(image.id)}
                aria-pressed={value.imageId === image.id}
                className={`aspect-square overflow-hidden rounded-md border-2 disabled:opacity-60 ${
                  value.imageId === image.id ? "border-accent" : "border-transparent hover:border-border"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- host propio del backend */}
                <img
                  src={imageUrl(image.url)}
                  alt={image.altText ?? image.originalFilename}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <FormField label="Texto alternativo (accesibilidad)" name="imageAlt">
        <input
          type="text"
          value={value.imageAlt ?? ""}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, imageAlt: e.target.value || null })}
          className={formInputClass}
        />
      </FormField>
    </div>
  );
}

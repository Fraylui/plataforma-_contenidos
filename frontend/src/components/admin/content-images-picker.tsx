"use client";

import { useState } from "react";
import { Link as LinkIcon } from "lucide-react";
import type { AdminImage } from "@/lib/api/admin-types";
import type { ContentImage } from "@/lib/api/types";
import { imageUrl } from "@/lib/image-url";
import { formInputClass } from "@/components/admin/ui";
import { InlineImageUpload } from "./inline-image-upload";
import { ContentMediaItemFields } from "./content-media-item-fields";

/**
 * Selector de imágenes de contenido (Publicaciones/Lugares/Eventos): mismo
 * comportamiento de grilla que el PlaceGalleryPicker original (clic para
 * agregar/quitar una imagen subida, orden = orden de selección) más un
 * campo para agregar imágenes por enlace externo — mayormente se agregan
 * por link, la subida es la opción secundaria. Cada imagen seleccionada
 * gana un título y un pie de foto opcionales (bloque tipo NYT/Medium). La
 * portada de tarjeta/feed es siempre la primera de la lista (ver ContentImage).
 */
export function ContentImagesPicker({
  allImages,
  value,
  onChange,
  disabled,
}: {
  allImages: AdminImage[];
  value: ContentImage[];
  onChange: (images: ContentImage[]) => void;
  disabled?: boolean;
}) {
  const [images, setImages] = useState(allImages);
  const [externalUrlDraft, setExternalUrlDraft] = useState("");

  function uploadedIndex(imageId: string): number {
    return value.findIndex((v) => v.imageId === imageId);
  }

  function toggleUploaded(imageId: string) {
    if (disabled) return;
    const index = uploadedIndex(imageId);
    onChange(
      index >= 0
        ? value.filter((_, i) => i !== index)
        : [...value, { imageId, externalUrl: null, title: null, caption: null }],
    );
  }

  function handleUploaded(image: AdminImage) {
    setImages((prev) => [image, ...prev]);
    onChange([...value, { imageId: image.id, externalUrl: null, title: null, caption: null }]);
  }

  function addExternalUrl() {
    const url = externalUrlDraft.trim();
    if (!url) return;
    onChange([...value, { imageId: null, externalUrl: url, title: null, caption: null }]);
    setExternalUrlDraft("");
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function updateAt(index: number, patch: Partial<ContentImage>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="mt-1 space-y-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted" htmlFor="content-image-external-url">
            Agregar imagen por enlace externo (lo más común)
          </label>
          <input
            id="content-image-external-url"
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
          onClick={addExternalUrl}
          className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent-soft hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LinkIcon className="h-4 w-4" aria-hidden="true" />
          Agregar
        </button>
      </div>

      <InlineImageUpload disabled={disabled} onUploaded={handleUploaded} compact />

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((image) => {
            const index = uploadedIndex(image.id);
            const selected = index >= 0;
            return (
              <button
                key={image.id}
                type="button"
                disabled={disabled}
                onClick={() => toggleUploaded(image.id)}
                aria-pressed={selected}
                className={`group relative aspect-square overflow-hidden rounded-md border-2 disabled:opacity-60 ${
                  selected ? "border-accent" : "border-transparent hover:border-border"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- host propio del backend */}
                <img
                  src={imageUrl(image.url)}
                  alt={image.altText ?? image.originalFilename}
                  className="h-full w-full object-cover"
                />
                {selected && (
                  <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                    {index + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {value.length > 0 && (
        <>
          <p className="text-xs text-muted">
            {value.length} imagen{value.length === 1 ? "" : "es"} seleccionada{value.length === 1 ? "" : "s"} — la
            primera es la portada. Título y pie de foto son opcionales.
          </p>
          <ul className="space-y-2">
            {value.map((item, index) => {
              const uploaded = images.find((image) => image.id === item.imageId);
              const thumbnailSrc = uploaded ? imageUrl(uploaded.url) : item.externalUrl;
              return (
                <ContentMediaItemFields
                  key={`${item.imageId ?? item.externalUrl}-${index}`}
                  index={index}
                  label={item.externalUrl ?? uploaded?.originalFilename ?? "Imagen subida"}
                  title={item.title ?? ""}
                  caption={item.caption ?? ""}
                  onTitleChange={(title) => updateAt(index, { title: title || null })}
                  onCaptionChange={(caption) => updateAt(index, { caption: caption || null })}
                  onRemove={() => removeAt(index)}
                  disabled={disabled}
                  thumbnail={
                    thumbnailSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element -- miniatura de un host externo o propio, según el ítem
                      <img src={thumbnailSrc} alt="" className="h-full w-full object-cover" />
                    ) : undefined
                  }
                />
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

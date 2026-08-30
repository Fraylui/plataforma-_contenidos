"use client";

import { useState } from "react";
import type { AdminImage } from "@/lib/api/admin-types";
import { imageUrl } from "@/lib/image-url";
import { InlineImageUpload } from "./inline-image-upload";

/**
 * Selector de galería (sección 6, "Fotografías"): clic para agregar/quitar,
 * el orden de selección es el orden de la galería (sin drag & drop — fuera
 * de alcance para el MVP). Puede subir fotos nuevas ahí mismo (InlineImageUpload),
 * no depende de haber pasado antes por Medios.
 */
export function PlaceGalleryPicker({
  allImages,
  value,
  onChange,
  disabled,
}: {
  allImages: AdminImage[];
  value: string[];
  onChange: (imageIds: string[]) => void;
  disabled?: boolean;
}) {
  const [images, setImages] = useState(allImages);

  function toggle(imageId: string) {
    if (disabled) return;
    onChange(value.includes(imageId) ? value.filter((id) => id !== imageId) : [...value, imageId]);
  }

  function handleUploaded(image: AdminImage) {
    setImages((prev) => [image, ...prev]);
    onChange([...value, image.id]);
  }

  if (images.length === 0) {
    return <InlineImageUpload disabled={disabled} onUploaded={handleUploaded} />;
  }

  return (
    <div>
      <InlineImageUpload disabled={disabled} onUploaded={handleUploaded} compact />
      {value.length > 0 && (
        <p className="mt-1 text-xs text-muted">
          {value.length} imagen{value.length === 1 ? "" : "es"} seleccionada{value.length === 1 ? "" : "s"}, en este
          orden.
        </p>
      )}
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((image) => {
          const selected = value.includes(image.id);
          const order = value.indexOf(image.id);
          return (
            <button
              key={image.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(image.id)}
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
                  {order + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { AdminImage } from "@/lib/api/admin-types";
import { imageUrl } from "@/lib/image-url";
import { InlineImageUpload } from "./inline-image-upload";

/**
 * Variante de selección única de PlaceGalleryPicker (mismo grid visual):
 * un artículo tiene UNA foto destacada, no una galería — clic en la ya
 * seleccionada la quita, clic en otra la reemplaza (no acumula).
 */
export function ArticleFeaturedImagePicker({
  allImages,
  value,
  onChange,
  disabled,
}: {
  allImages: AdminImage[];
  value: string | null;
  onChange: (imageId: string | null) => void;
  disabled?: boolean;
}) {
  const [images, setImages] = useState(allImages);

  function toggle(imageId: string) {
    if (disabled) return;
    onChange(value === imageId ? null : imageId);
  }

  function handleUploaded(image: AdminImage) {
    setImages((prev) => [image, ...prev]);
    onChange(image.id);
  }

  if (images.length === 0) {
    return <InlineImageUpload disabled={disabled} onUploaded={handleUploaded} />;
  }

  return (
    <div>
      <InlineImageUpload disabled={disabled} onUploaded={handleUploaded} compact />
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((image) => {
          const selected = value === image.id;
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
                <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

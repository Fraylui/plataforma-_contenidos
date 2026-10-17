"use client";

import { useState } from "react";
import { ImageSquare, X } from "@phosphor-icons/react";
import type { AdminImage } from "@/lib/api/admin-types";
import { imageUrl } from "@/lib/image-url";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/admin/ui";
import { Button } from "@/components/ui";
import { InlineImageUpload } from "./inline-image-upload";

/**
 * Portada fija de una serie (arte del programa): una imagen de la biblioteca,
 * subida aquí mismo o elegida de las ya subidas. Sin portada, el sitio usa la
 * miniatura del último episodio.
 */
export function SeriesCoverPicker({
  value,
  onChange,
  allImages,
  disabled,
}: {
  value: string | null;
  onChange: (imageId: string | null) => void;
  allImages: AdminImage[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState(allImages);
  const current = value ? images.find((image) => image.id === value) : null;

  function pick(imageId: string) {
    onChange(imageId);
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Portada</p>
      <div className="flex items-center gap-3">
        <span className="flex aspect-video w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-canvas-strong text-muted">
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagen de la biblioteca servida por el backend, igual que image-card.tsx
            <img src={imageUrl(current.url)} alt="" className="size-full object-cover" />
          ) : (
            <ImageSquare className="size-6" aria-hidden="true" />
          )}
        </span>
        <div className="flex flex-col items-start gap-1.5">
          <Button size="sm" variant="secondary" disabled={disabled} onClick={() => setOpen(true)}>
            {current ? "Cambiar portada" : "Elegir portada"}
          </Button>
          {current ? (
            <Button size="sm" variant="ghost" icon={<X aria-hidden="true" />} disabled={disabled} onClick={() => onChange(null)}>
              Quitar
            </Button>
          ) : (
            <p className="text-xs text-muted">Sin portada se usa la miniatura del último episodio.</p>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Portada de la serie</DialogTitle>
          <DialogDescription>Una imagen horizontal (16:9) se ve mejor, como la portada de un programa.</DialogDescription>
          <div className="mt-4 space-y-3">
            <InlineImageUpload
              compact
              onUploaded={(image) => {
                setImages((prev) => [image, ...prev]);
                pick(image.id);
              }}
            />
            {images.length > 0 && (
              <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto">
                {images.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => pick(image.id)}
                    aria-label={`Usar ${image.altText ?? image.originalFilename} como portada`}
                    aria-pressed={image.id === value}
                    className={`aspect-video overflow-hidden rounded-lg ring-offset-2 ring-offset-surface focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none ${
                      image.id === value ? "ring-2 ring-accent" : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- imagen de la biblioteca servida por el backend */}
                    <img src={imageUrl(image.url)} alt="" loading="lazy" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

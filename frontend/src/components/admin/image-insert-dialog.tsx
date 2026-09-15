"use client";

import { useState } from "react";
import { Link as LinkIcon } from "lucide-react";
import type { AdminImage } from "@/lib/api/admin-types";
import { imageUrl } from "@/lib/image-url";
import { Dialog, DialogContent, DialogTitle, DialogDescription, formInputClass } from "@/components/admin/ui";
import { InlineImageUpload } from "./inline-image-upload";

/**
 * Modal para insertar una imagen dentro del cuerpo del editor (posición
 * elegida por quien escribe, a diferencia del panel lateral de "Portada"/
 * galería que sigue existiendo aparte). Mismas dos vías que
 * ContentImagesPicker: elegir una ya subida o pegar un enlace externo —
 * pero acá es insertar-y-cerrar, no una selección persistente con orden.
 */
export function ImageInsertDialog({
  open,
  onOpenChange,
  allImages,
  onInsert,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allImages: AdminImage[];
  onInsert: (src: string, alt: string) => void;
}) {
  const [images, setImages] = useState(allImages);
  const [externalUrlDraft, setExternalUrlDraft] = useState("");

  function insertAndClose(src: string, alt: string) {
    onInsert(src, alt);
    setExternalUrlDraft("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Insertar imagen</DialogTitle>
        <DialogDescription>Se inserta en el cuerpo, en la posición del cursor.</DialogDescription>

        <div className="mt-4 space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted" htmlFor="rte-image-external-url">
                Por enlace externo
              </label>
              <input
                id="rte-image-external-url"
                type="text"
                value={externalUrlDraft}
                onChange={(e) => setExternalUrlDraft(e.target.value)}
                placeholder="https://…"
                className={formInputClass}
              />
            </div>
            <button
              type="button"
              disabled={!externalUrlDraft.trim()}
              onClick={() => insertAndClose(externalUrlDraft.trim(), "")}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent-soft hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LinkIcon className="h-4 w-4" aria-hidden="true" />
              Insertar
            </button>
          </div>

          <InlineImageUpload
            compact
            onUploaded={(image) => {
              setImages((prev) => [image, ...prev]);
              insertAndClose(imageUrl(image.url), image.altText ?? "");
            }}
          />

          {images.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted">O elegir una ya subida</p>
              <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto">
                {images.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => insertAndClose(imageUrl(image.url), image.altText ?? "")}
                    className="aspect-square overflow-hidden rounded-md border-2 border-transparent hover:border-accent"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

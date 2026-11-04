"use client";

import { useState } from "react";
import { Images } from "@phosphor-icons/react";
import type { AdminImage } from "@/lib/api/admin-types";
import type { ContentImage } from "@/lib/api/types";
import { imageUrl } from "@/lib/image-url";
import { PhotoDropZone } from "./photo-drop-zone";
import { ContentMediaItemFields } from "./content-media-item-fields";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/admin/ui";
import { Button } from "@/components/ui";
import { BrokenImageNotice, PreviewImage } from "@/components/ui/preview-image";

/**
 * Etiqueta corta de un enlace: dominio … archivo. Los enlaces de un mismo
 * sitio comparten el principio, así que cortar al final los dejaba iguales.
 */
export function shortImageLabel(url: string): string {
  try {
    const parsed = new URL(url);
    const file = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() ?? "");
    return file ? `${parsed.hostname} … ${file}` : parsed.hostname;
  } catch {
    return url;
  }
}

/**
 * Selector de imágenes de contenido (Publicaciones/Lugares/Celebraciones):
 * subir fotos propias (cuadro grande, varias a la vez) o volver a usar una
 * ya subida desde la biblioteca (en un diálogo, para que la biblioteca entera
 * no empuje el título fuera de la pantalla; orden = orden de selección).
 * Ya no se ofrece pegar enlaces de otros sitios: las fotos son del dueño
 * (CONTEXTO.md 1.4). Las que ya se guardaron así se siguen mostrando y se
 * pueden quitar. Cada imagen seleccionada
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
  const [libraryOpen, setLibraryOpen] = useState(false);
  // Enlaces que no cargaron: se avisa en su fila en vez de mostrar un ícono roto.
  const [brokenSrcs, setBrokenSrcs] = useState<string[]>([]);

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

  function handleUploaded(uploaded: AdminImage[]) {
    setImages((prev) => [...uploaded, ...prev]);
    onChange([...value, ...uploaded.map((image) => ({ imageId: image.id, externalUrl: null, title: null, caption: null }))]);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function updateAt(index: number, patch: Partial<ContentImage>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="mt-1 space-y-3">
      <PhotoDropZone disabled={disabled} onUploaded={handleUploaded} />
      {images.length > 0 && (
        <Button variant="secondary" size="sm" icon={<Images />} disabled={disabled} onClick={() => setLibraryOpen(true)}>
          Usar una foto que ya subiste
        </Button>
      )}

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="flex max-h-[85dvh] max-w-2xl flex-col">
          <DialogTitle>Tus fotos subidas</DialogTitle>
          <DialogDescription>Toca para elegir o quitar. El número es el orden; la 1 es la portada.</DialogDescription>
          <div className="-mx-2 mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
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
                    aria-label={image.altText ?? image.originalFilename}
                    className={`group relative aspect-square cursor-pointer overflow-hidden rounded-control outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-60 ${
                      selected ? "ring-[3px] ring-accent" : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- host propio del backend */}
                    <img
                      src={imageUrl(image.url)}
                      alt=""
                      loading="lazy"
                      width={image.width}
                      height={image.height}
                      className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                    />
                    {selected && (
                      <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-accent-fill text-xs font-semibold text-accent-foreground tabular-nums">
                        {index + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setLibraryOpen(false)}>
              {value.length > 0 ? `Listo (${value.length})` : "Listo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {value.length > 0 && (
        <>
          <p className="text-xs text-muted">
            {value.length} {value.length === 1 ? "imagen seleccionada" : "imágenes seleccionadas"} — la
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
                  label={item.externalUrl ? shortImageLabel(item.externalUrl) : (uploaded?.originalFilename ?? "Imagen subida")}
                  fullLabel={item.externalUrl ?? undefined}
                  warning={
                    thumbnailSrc && brokenSrcs.includes(thumbnailSrc)
                      ? "No se pudo cargar esta imagen. Quítala y sube la foto desde tu celular o computadora."
                      : null
                  }
                  title={item.title ?? ""}
                  caption={item.caption ?? ""}
                  onTitleChange={(title) => updateAt(index, { title: title || null })}
                  onCaptionChange={(caption) => updateAt(index, { caption: caption || null })}
                  onRemove={() => removeAt(index)}
                  disabled={disabled}
                  thumbnail={
                    thumbnailSrc ? (
                      <PreviewImage
                        src={thumbnailSrc}
                        fallback={<BrokenImageNotice compact />}
                        onError={() => setBrokenSrcs((prev) => (prev.includes(thumbnailSrc) ? prev : [...prev, thumbnailSrc]))}
                      />
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

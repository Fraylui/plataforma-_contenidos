"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash } from "@phosphor-icons/react";
import type { AdminImage } from "@/lib/api/admin-types";
import { imageUrl } from "@/lib/image-url";
import { Badge, Button, TextInput } from "@/components/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/admin/ui/alert-dialog";
import { deleteImageAction, updateImageAltTextAction } from "@/app/admin/(protected)/imagenes/actions";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageCard({ image, canManage }: { image: AdminImage; canManage: boolean }) {
  const router = useRouter();
  const [altText, setAltText] = useState(image.altText ?? "");
  // Lo último guardado: «Guardar» aparece solo cuando hay un cambio que guardar.
  const [savedAltText, setSavedAltText] = useState(image.altText ?? "");
  const dirty = altText.trim() !== savedAltText.trim();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveAlt() {
    setPending(true);
    setError(null);
    const result = await updateImageAltTextAction(image.id, altText);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSavedAltText(altText);
    toast.success("Descripción guardada.");
  }

  async function handleDelete() {
    setPending(true);
    setError(null);
    const result = await deleteImageAction(image.id);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-card bg-surface shadow-card">
      <div className="relative aspect-video overflow-hidden bg-border">
        {/* eslint-disable-next-line @next/next/no-img-element -- host propio del backend, no un dominio remoto configurable en next/image sin acoplar el frontend a un entorno fijo */}
        <img src={imageUrl(image.url)} alt={image.altText ?? image.originalFilename} className="h-full w-full object-cover" />
        {image.purpose === "AD" && (
          <Badge className="absolute top-2 left-2 shadow-card">Publicidad</Badge>
        )}
        {/* Foto de una historia: se borra sola con ella a los 7 días de terminar. */}
        {image.purpose === "STORY" && (
          <Badge className="absolute top-2 left-2 shadow-card">Historia</Badge>
        )}
        {canManage && (
          <>
            {/* Borrar no se deshace: se confirma. Si está en uso, el backend lo impide (409) y se muestra por qué. */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  aria-label="Eliminar imagen"
                  title="Eliminar imagen"
                  className="absolute top-1.5 right-1.5 size-11 rounded-full bg-surface/90 p-0 text-danger-ink shadow-card backdrop-blur hover:bg-danger-soft"
                >
                  <Trash className="size-5" aria-hidden="true" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>¿Eliminar esta imagen?</AlertDialogTitle>
                <AlertDialogDescription>
                  No se puede deshacer. Si algún contenido o anuncio la usa, no se eliminará hasta que la quites de ahí.
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel asChild>
                    <Button variant="secondary">Cancelar</Button>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button variant="danger" onClick={handleDelete}>
                      Eliminar
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="truncate text-xs font-medium text-foreground" title={image.originalFilename}>
          {image.originalFilename}
        </p>
        <p className="text-xs tabular-nums text-muted">
          {image.width}×{image.height} · {formatBytes(image.sizeBytes)}
        </p>

        {canManage ? (
          <>
            <TextInput
              type="text"
              name="altText"
              aria-label="Describe la foto (la leen Google y los lectores de pantalla)"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && dirty) {
                  e.preventDefault();
                  void handleSaveAlt();
                }
              }}
              placeholder="Describe la foto"
              className="h-9 text-xs"
            />
            {dirty && (
              <Button size="sm" disabled={pending} onClick={handleSaveAlt}>
                Guardar
              </Button>
            )}
          </>
        ) : (
          image.altText && <p className="text-xs text-muted">{image.altText}</p>
        )}

        {error && <p role="alert" className="text-xs font-medium text-danger-ink">{error}</p>}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveAlt() {
    setPending(true);
    setError(null);
    const result = await updateImageAltTextAction(image.id, altText);
    setPending(false);
    if (!result.ok) setError(result.error);
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
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="truncate text-xs font-medium text-foreground" title={image.originalFilename}>
          {image.originalFilename}
        </p>
        <p className="text-xs text-muted">
          {image.width}×{image.height} · {formatBytes(image.sizeBytes)}
        </p>

        {canManage ? (
          <>
            <TextInput
              type="text"
              name="altText"
              aria-label="Texto alternativo"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Texto alternativo"
              className="h-8 text-xs"
            />
            <div className="mt-1 flex gap-2">
              <Button size="sm" variant="secondary" disabled={pending} onClick={handleSaveAlt} className="flex-1">
                Guardar
              </Button>
              {/* Borrar no se deshace y el backend no revisa si alguna publicación la usa: se confirma. */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" disabled={pending} className="text-danger-ink hover:bg-danger-soft">
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>¿Eliminar esta imagen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Si alguna publicación o anuncio la usa, dejará de verse en el sitio. No se puede deshacer.
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
            </div>
          </>
        ) : (
          image.altText && <p className="text-xs text-muted">Alt: {image.altText}</p>
        )}

        {error && <p role="alert" className="text-xs font-medium text-danger-ink">{error}</p>}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminImage } from "@/lib/api/admin-types";
import { imageUrl } from "@/lib/image-url";
import { deleteImageAction, updateImageAltTextAction } from "@/app/admin/(protected)/medios/actions";

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
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="aspect-video bg-border">
        {/* eslint-disable-next-line @next/next/no-img-element -- host propio del backend, no un dominio remoto configurable en next/image sin acoplar el frontend a un entorno fijo */}
        <img src={imageUrl(image.url)} alt={image.altText ?? image.originalFilename} className="h-full w-full object-cover" />
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
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Texto alternativo"
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus-visible:border-accent"
            />
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={handleSaveAlt}
                className="flex-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-accent-soft hover:text-accent disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleDelete}
                className="rounded-md border border-border px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                Eliminar
              </button>
            </div>
          </>
        ) : (
          image.altText && <p className="text-xs text-muted">Alt: {image.altText}</p>
        )}

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}

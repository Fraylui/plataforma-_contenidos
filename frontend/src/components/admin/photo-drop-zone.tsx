"use client";

import { useRef, useState } from "react";
import { ImageSquare } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { AdminImage, ImagePurpose } from "@/lib/api/admin-types";
import { uploadImageInlineAction } from "@/app/admin/(protected)/imagenes/actions";

/** Solo archivos de imagen; lo demás que se arrastre se ignora. */
export function onlyImages(files: Iterable<File>): File[] {
  return Array.from(files).filter((file) => file.type.startsWith("image/"));
}

/**
 * Subir fotos propias: un solo lugar grande donde tocar (abre la galería del
 * celular o los archivos de la computadora) o soltar fotos arrastradas.
 * Varias a la vez: se suben en orden y se entregan juntas al terminar (una
 * sola actualización: subidas seguidas no se pisan entre sí). Si alguna
 * falla, las demás igual se agregan y se dice cuál falló.
 * Reemplaza a «Subir foto nueva» + «pega el enlace»: las fotos son del dueño
 * y viven en la plataforma, no en otro sitio (CONTEXTO.md 1.4).
 */
export function PhotoDropZone({
  onUploaded,
  disabled,
  purpose = "CONTENT",
}: {
  onUploaded: (images: AdminImage[]) => void;
  disabled?: boolean;
  purpose?: ImagePurpose;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const busy = progress !== null;

  async function uploadAll(files: File[]) {
    if (files.length === 0 || disabled || busy) return;
    setErrors([]);
    const failed: string[] = [];
    const uploaded: AdminImage[] = [];
    for (let i = 0; i < files.length; i++) {
      setProgress({ done: i, total: files.length });
      const formData = new FormData();
      formData.set("file", files[i]);
      formData.set("purpose", purpose);
      const result = await uploadImageInlineAction(formData);
      if (result.ok) uploaded.push(result.data);
      else failed.push(`${files[i].name}: ${result.error}`);
    }
    setProgress(null);
    setErrors(failed);
    if (uploaded.length > 0) onUploaded(uploaded);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void uploadAll(onlyImages(event.dataTransfer.files));
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-card border-2 border-dashed px-4 py-7 text-center transition-colors",
          "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring",
          dragging ? "border-accent bg-accent-soft" : "border-border hover:border-accent/60 hover:bg-accent-soft/40",
          (disabled || busy) && "pointer-events-none opacity-70",
        )}
      >
        <ImageSquare className="size-8 text-accent" aria-hidden="true" />
        <span className="text-sm font-semibold text-foreground">
          {busy ? `Subiendo ${progress.done + 1} de ${progress.total}…` : "Sube tus fotos"}
        </span>
        {!busy && (
          <span className="text-xs text-muted">Toca para elegirlas del celular o la computadora, o arrástralas aquí. Puedes elegir varias.</span>
        )}
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={disabled || busy}
          onChange={(event) => void uploadAll(onlyImages(event.target.files ?? []))}
        />
      </label>
      {errors.length > 0 && (
        <ul role="alert" className="mt-2 space-y-0.5 text-xs text-danger">
          {errors.map((message) => (
            <li key={message}>No se pudo subir {message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import type { AdminImage } from "@/lib/api/admin-types";
import { uploadImageInlineAction } from "@/app/admin/(protected)/medios/actions";

/**
 * Botón de subida embebido en los selectores de imagen (Foto destacada,
 * Fotografías) — evita el viaje a Medios antes de poder ilustrar una
 * publicación (mismo criterio que "+ Crear" en GeographyPicker).
 */
export function InlineImageUpload({
  onUploaded,
  disabled,
  compact,
}: {
  onUploaded: (image: AdminImage) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadImageInlineAction(formData);
    setPending(false);
    if (inputRef.current) inputRef.current.value = "";
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onUploaded(result.data);
  }

  return (
    <div className={compact ? "mb-2" : "mt-1"}>
      <label
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent ${
          disabled || pending ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M10 2a.75.75 0 0 1 .75.75v6.5h6.5a.75.75 0 0 1 0 1.5h-6.5v6.5a.75.75 0 0 1-1.5 0v-6.5h-6.5a.75.75 0 0 1 0-1.5h6.5v-6.5A.75.75 0 0 1 10 2Z" />
        </svg>
        {pending ? "Subiendo…" : "Subir foto nueva"}
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept="image/*"
          className="sr-only"
          disabled={disabled || pending}
          onChange={handleChange}
        />
      </label>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { UploadSimple } from "@phosphor-icons/react";
import { buttonClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { AdminImage } from "@/lib/api/admin-types";
import { uploadImageInlineAction } from "@/app/admin/(protected)/imagenes/actions";

/**
 * Botón de subida embebido en los selectores de imagen (Foto destacada,
 * Fotografías) — evita el viaje a Medios antes de poder ilustrar una
 * publicación.
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
      <label className={buttonClass("secondary", "sm", cn("cursor-pointer has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring", (disabled || pending) && "pointer-events-none opacity-60"))}>
        <UploadSimple aria-hidden="true" />
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
      {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

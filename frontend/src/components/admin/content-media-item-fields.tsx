"use client";

import { X } from "lucide-react";
import { formInputClass } from "@/components/admin/ui";

/**
 * Campos de título + pie de foto compartidos por cada imagen/video
 * seleccionado (ContentImagesPicker y VideoLinksEditor) — mismo bloque tipo
 * NYT/Medium/Wikipedia en ambos. `thumbnail` es opcional (los videos no
 * tienen una miniatura propia acá).
 */
export function ContentMediaItemFields({
  index,
  thumbnail,
  label,
  title,
  caption,
  onTitleChange,
  onCaptionChange,
  onRemove,
  disabled,
}: {
  index: number;
  thumbnail?: React.ReactNode;
  label: string;
  title: string;
  caption: string;
  onTitleChange: (value: string) => void;
  onCaptionChange: (value: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <li className="flex gap-3 rounded-md border border-border p-3">
      {thumbnail && <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface">{thumbnail}</div>}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs text-muted">{label}</span>
          {!disabled && (
            <button
              type="button"
              onClick={onRemove}
              aria-label="Quitar"
              className="cursor-pointer text-muted hover:text-accent"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <input
          type="text"
          value={title}
          disabled={disabled}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Título (opcional)"
          className={`${formInputClass} h-8 text-sm`}
        />
        <input
          type="text"
          value={caption}
          disabled={disabled}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Pie de foto (opcional)"
          className={`${formInputClass} h-8 text-sm`}
        />
      </div>
    </li>
  );
}

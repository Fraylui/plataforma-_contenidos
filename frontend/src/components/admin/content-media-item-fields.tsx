"use client";

import { X } from "@phosphor-icons/react";
import { TextArea } from "@/components/ui";

/** Mismos límites que la base (V34: título 200, pie 500). */
const TITLE_MAX = 200;
const CAPTION_MAX = 500;
// Una línea que crece con el texto (field-sizing), sin la altura mínima de un área de texto.
const GROWING = "min-h-0 resize-none field-sizing-content py-1.5 text-sm";

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
  warning,
  fullLabel,
}: {
  index: number;
  thumbnail?: React.ReactNode;
  label: string;
  /** El texto completo de `label` (p. ej. el enlace entero) para leerlo al pasar el mouse. */
  fullLabel?: string;
  /** Problema con este medio (p. ej. el enlace no carga). */
  warning?: string | null;
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
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-fill text-xs font-medium text-accent-foreground">
            {index + 1}
          </span>
          {/* Hasta 2 líneas: en celular una sola cortaba antes del nombre del archivo, que es lo que distingue. */}
          <span className="line-clamp-2 min-w-0 flex-1 text-xs text-muted [overflow-wrap:anywhere]" title={fullLabel ?? label}>
            {label}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Quitar ${index + 1}`}
              className="cursor-pointer text-muted hover:text-accent"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        {warning && (
          <p role="alert" className="text-xs font-medium text-warning">
            {warning}
          </p>
        )}
        <TextArea
          rows={1}
          value={title}
          maxLength={TITLE_MAX}
          counter={false}
          disabled={disabled}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          aria-label={`Título de ${index + 1} (opcional)`}
          placeholder="Título (opcional)"
          className={GROWING}
        />
        <TextArea
          rows={1}
          value={caption}
          maxLength={CAPTION_MAX}
          counter={false}
          disabled={disabled}
          onChange={(e) => onCaptionChange(e.target.value)}
          aria-label={`Pie de ${index + 1} (opcional)`}
          placeholder="Pie de foto (opcional)"
          className={GROWING}
        />
      </div>
    </li>
  );
}

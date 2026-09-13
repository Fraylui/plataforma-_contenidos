"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { formInputClass } from "@/components/admin/ui";

/**
 * Lista de videos de YouTube por URL (varios por publicación/lugar/evento
 * — antes solo uno). El backend valida y extrae el Video ID de cada URL al
 * guardar (YouTubeUrlParser); acá solo se junta la lista de URLs pegadas.
 */
export function VideoLinksEditor({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const url = draft.trim();
    if (!url) return;
    onChange([...value, url]);
    setDraft("");
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((url, index) => (
            <li key={index} className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
              <span className="min-w-0 flex-1 truncate text-foreground">{url}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label="Quitar video"
                  className="cursor-pointer text-muted hover:text-accent"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!disabled && (
        <div className="flex items-end gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            className={`${formInputClass} flex-1`}
          />
          <button
            type="button"
            disabled={!draft.trim()}
            onClick={add}
            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent-soft hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar
          </button>
        </div>
      )}
    </div>
  );
}

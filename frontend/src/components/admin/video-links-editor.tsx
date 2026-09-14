"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { ContentVideoInput } from "@/lib/api/admin-types";
import { formInputClass } from "@/components/admin/ui";
import { ContentMediaItemFields } from "./content-media-item-fields";

/**
 * Lista de videos de YouTube por URL (varios por publicación/lugar/evento).
 * El título se autorrellena al pegar el link vía oEmbed de YouTube (proxy
 * propio, sin API key) — editable a mano después; si oEmbed falla, se
 * escribe a mano. El backend valida y extrae el Video ID de cada URL al
 * guardar (YouTubeUrlParser).
 */
export function VideoLinksEditor({
  value,
  onChange,
  disabled,
}: {
  value: ContentVideoInput[];
  onChange: (videos: ContentVideoInput[]) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [fetchingTitle, setFetchingTitle] = useState(false);

  async function add() {
    const url = draft.trim();
    if (!url) return;
    setDraft("");
    setFetchingTitle(true);
    let title: string | null = null;
    try {
      const res = await fetch(`/api/youtube-oembed?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = (await res.json()) as { title: string | null };
        title = data.title;
      }
    } catch {
      // Sin título autorrellenado — se puede escribir a mano.
    }
    setFetchingTitle(false);
    onChange([...value, { url, title, caption: null }]);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function updateAt(index: number, patch: Partial<ContentVideoInput>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((video, index) => (
            <ContentMediaItemFields
              key={`${video.url}-${index}`}
              index={index}
              label={video.url}
              title={video.title ?? ""}
              caption={video.caption ?? ""}
              onTitleChange={(title) => updateAt(index, { title: title || null })}
              onCaptionChange={(caption) => updateAt(index, { caption: caption || null })}
              onRemove={() => removeAt(index)}
              disabled={disabled}
            />
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
            disabled={!draft.trim() || fetchingTitle}
            onClick={add}
            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent-soft hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {fetchingTitle ? "Agregando…" : "Agregar"}
          </button>
        </div>
      )}
    </div>
  );
}

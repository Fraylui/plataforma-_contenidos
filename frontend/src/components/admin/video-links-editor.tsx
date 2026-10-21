"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import type { ContentVideoInput } from "@/lib/api/admin-types";
import { ContentMediaItemFields } from "./content-media-item-fields";
import { Button, TextInput } from "@/components/ui";

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
    <div className="mt-1 space-y-2">
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
          <TextInput
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            className="flex-1"
            onKeyDown={(e) => {
              // Enter agrega el video en vez de enviar el formulario.
              if (e.key === "Enter") {
                e.preventDefault();
                if (draft.trim() && !fetchingTitle) void add();
              }
            }}
          />
          <Button variant="secondary" size="lg" icon={<Plus />} disabled={!draft.trim() || fetchingTitle} onClick={() => void add()}>
            {fetchingTitle ? "Agregando…" : "Agregar"}
          </Button>
        </div>
      )}
    </div>
  );
}

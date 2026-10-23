"use client";

import { useEffect, useId, useState } from "react";
import { X } from "@phosphor-icons/react";
import type { SearchResult, StoryLinkType } from "@/lib/api/types";
import { searchResultTypeLabel } from "@/lib/content-labels";
import { TextInput } from "@/components/ui";

export interface StoryLinkValue {
  type: StoryLinkType;
  id: string;
  title: string;
}

const LINKABLE: ReadonlySet<string> = new Set<StoryLinkType>(["PUBLICATION", "PLACE", "CELEBRATION", "GALLERY"]);

/**
 * A qué contenido lleva la historia: busca entre lo publicado (el buscador del
 * sitio, que solo devuelve publicado) y deja elegir una publicación, un
 * lugar, una celebración o una galería.
 */
export function StoryLinkPicker({ value, onChange, disabled }: {
  value: StoryLinkValue | null;
  onChange: (value: StoryLinkValue | null) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-suggest?q=${encodeURIComponent(trimmed)}&size=8`, { signal: controller.signal });
        const data: { items: SearchResult[] } = await res.json();
        setResults(data.items.filter((item) => LINKABLE.has(item.contentType)));
      } catch {
        // búsqueda cancelada o sin red: la lista queda como estaba
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-control bg-canvas-strong px-3 py-2 text-sm">
        <span className="min-w-0 truncate font-medium text-foreground">{`Lleva a: ${value.title}`}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Quitar enlace"
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground"
        >
          <X weight="bold" className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">
        Buscar contenido
      </label>
      <TextInput
        id={id}
        type="search"
        value={query}
        disabled={disabled}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Una publicación, un lugar…"
        autoComplete="off"
      />
      {query.trim().length >= 2 && results.length > 0 && (
        <ul className="mt-1 max-h-48 overflow-y-auto rounded-control bg-surface shadow-pop">
          {results.map((result) => (
            <li key={`${result.contentType}-${result.id}`}>
              <button
                type="button"
                onClick={() => {
                  onChange({ type: result.contentType as StoryLinkType, id: result.id, title: result.title });
                  setQuery("");
                  setResults([]);
                }}
                className="flex w-full cursor-pointer items-baseline gap-2 px-3 py-2 text-left text-sm hover:bg-canvas"
              >
                <span className="min-w-0 truncate font-medium text-foreground">{result.title}</span>
                <span className="shrink-0 text-xs text-muted">{searchResultTypeLabel(result.contentType)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

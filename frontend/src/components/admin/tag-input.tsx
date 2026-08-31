"use client";

import { useState, type KeyboardEvent } from "react";

/**
 * Entrada de etiquetas libres (chips). El backend crea el Tag si el nombre
 * todavía no existe (TagService.getOrCreate) — no hay un catálogo cerrado
 * que elegir aquí, a diferencia de categoría.
 */
export function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const name = draft.trim();
    if (name && !value.includes(name)) {
      onChange([...value, name]);
    }
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeTag(name: string) {
    onChange(value.filter((tag) => tag !== name));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 focus-within:border-accent">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            aria-label={`Quitar etiqueta ${tag}`}
            className="hover:opacity-70"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        name="tagDraft"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder={value.length === 0 ? "Escribe y presiona Enter…" : ""}
        className="min-w-[8rem] flex-1 bg-transparent py-0.5 text-sm text-foreground outline-none"
      />
    </div>
  );
}

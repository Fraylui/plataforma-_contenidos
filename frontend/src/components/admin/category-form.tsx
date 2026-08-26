"use client";

import { useState } from "react";
import type { Category } from "@/lib/api/types";
import { createCategoryAction, updateCategoryAction, type ActionResult } from "@/app/admin/(protected)/categorias/actions";

interface CategoryFormProps {
  mode: "create" | "edit";
  category?: Category;
  /** Categorías candidatas a padre, ya sin la propia categoría (si es edición) para no auto-referenciarse. */
  parentOptions: { id: string; depth: number; name: string }[];
}

export function CategoryForm({ mode, category, parentOptions }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [parentId, setParentId] = useState(category?.parentId ?? "");
  const [sortOrder, setSortOrder] = useState(category?.sortOrder ?? 0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit() {
    setPending(true);
    setError(null);
    setNotice(null);
    const base = { name, description: description || null, parentId: parentId || null };
    const result: ActionResult =
      mode === "create"
        ? await createCategoryAction(base)
        : await updateCategoryAction(category!.id, { ...base, sortOrder });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotice("Guardado.");
  }

  return (
    <div className="max-w-lg space-y-4">
      <label className="block text-sm font-medium text-foreground">
        Nombre
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      <label className="block text-sm font-medium text-foreground">
        Descripción (opcional)
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      <label className="block text-sm font-medium text-foreground">
        Categoría padre (opcional, para subcategorías)
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
        >
          <option value="">Ninguna (categoría raíz)</option>
          {parentOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {"— ".repeat(option.depth)}
              {option.name}
            </option>
          ))}
        </select>
      </label>

      {mode === "edit" && (
        <label className="block text-sm font-medium text-foreground">
          Orden
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="mt-1 w-32 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
          />
        </label>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {notice && <p className="text-sm text-accent">{notice}</p>}

      <button
        type="button"
        disabled={pending || !name.trim()}
        onClick={handleSubmit}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Guardando…" : mode === "create" ? "Crear categoría" : "Guardar cambios"}
      </button>
    </div>
  );
}

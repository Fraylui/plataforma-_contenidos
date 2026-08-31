"use client";

import { useState } from "react";
import type { Category } from "@/lib/api/types";
import { createCategoryAction, updateCategoryAction, type ActionResult } from "@/app/admin/(protected)/categorias/actions";
import { AdminButton, FormField, formInputClass } from "@/components/admin/ui";

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
      <FormField label="Nombre" name="name">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={formInputClass} />
      </FormField>

      <FormField label="Descripción (opcional)" name="description">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={formInputClass} />
      </FormField>

      <FormField label="Categoría padre (opcional, para subcategorías)" name="parentId">
        <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={formInputClass}>
          <option value="">Ninguna (categoría raíz)</option>
          {parentOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {"— ".repeat(option.depth)}
              {option.name}
            </option>
          ))}
        </select>
      </FormField>

      {mode === "edit" && (
        <FormField label="Orden" name="sortOrder">
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className={`${formInputClass} w-32`}
          />
        </FormField>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {notice && <p className="text-sm text-accent">{notice}</p>}

      <AdminButton disabled={pending || !name.trim()} onClick={handleSubmit}>
        {pending ? "Guardando…" : mode === "create" ? "Crear categoría" : "Guardar cambios"}
      </AdminButton>
    </div>
  );
}

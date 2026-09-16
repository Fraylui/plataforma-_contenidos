"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Category } from "@/lib/api/types";
import { createCategoryAction, updateCategoryAction, type ActionResult } from "@/app/admin/(protected)/categorias/actions";
import { AdminButton, Combobox, FormError, FormField, formInputClass } from "@/components/admin/ui";

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

  async function handleSubmit() {
    setPending(true);
    setError(null);
    const base = { name, description: description || null, parentId: parentId || null };
    const result: ActionResult =
      mode === "create"
        ? await createCategoryAction(base)
        : await updateCategoryAction(category!.id, { ...base, sortOrder });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Guardado.");
  }

  return (
    <div className="max-w-lg space-y-4 rounded-xl border border-border/60 bg-surface p-5">
      <FormField label="Nombre" name="name">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={formInputClass} />
      </FormField>

      <FormField label="Descripción (opcional)" name="description">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={formInputClass} />
      </FormField>

      <FormField label="Categoría padre (opcional, para subcategorías)" name="parentId">
        <Combobox
          options={parentOptions.map((option) => ({ id: option.id, label: `${"— ".repeat(option.depth)}${option.name}` }))}
          value={parentId || null}
          placeholder="Ninguna (categoría raíz)"
          onSelect={(id) => setParentId(id ?? "")}
        />
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

      {error && <FormError message={error} />}
      <AdminButton disabled={pending || !name.trim()} onClick={handleSubmit}>
        {pending ? "Guardando…" : mode === "create" ? "Crear categoría" : "Guardar cambios"}
      </AdminButton>
    </div>
  );
}

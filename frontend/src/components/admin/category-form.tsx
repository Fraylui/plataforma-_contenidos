"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Category } from "@/lib/api/types";
import { createCategoryAction, updateCategoryAction, type ActionResult } from "@/app/admin/(protected)/temas/actions";
import { FormError } from "@/components/admin/ui";
import { Button, Combobox, Field, TextArea, TextInput } from "@/components/ui";

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
      <Field label="Nombre" name="name">
        <TextInput type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <Field label="Descripción (opcional)" name="description">
        <TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </Field>

      <Field label="Tema principal (opcional, para subtemas)" name="parentId">
        <Combobox
          options={parentOptions.map((option) => ({ id: option.id, label: `${"— ".repeat(option.depth)}${option.name}` }))}
          value={parentId || null}
          placeholder="Ninguno (tema principal)"
          onSelect={(id) => setParentId(id ?? "")}
        />
      </Field>

      {mode === "edit" && (
        <Field label="Orden" name="sortOrder">
          <TextInput
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-32"
          />
        </Field>
      )}

      {error && <FormError message={error} />}
      <Button type="submit" disabled={pending || !name.trim()} onClick={handleSubmit}>
        {pending ? "Guardando…" : mode === "create" ? "Crear tema" : "Guardar cambios"}
      </Button>
    </div>
  );
}

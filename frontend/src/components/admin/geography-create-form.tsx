"use client";

import { useState } from "react";
import type { GeographicUnit, GeographyLevel } from "@/lib/api/types";
import { geographyLevelLabel } from "@/lib/content-labels";
import { parentCandidates } from "@/lib/admin/geography-tree";
import { createGeographyAction } from "@/app/admin/(protected)/geografia/actions";
import { AdminButton, FormField, formInputClass } from "@/components/admin/ui";

const LEVELS: GeographyLevel[] = ["PAIS", "REGION", "PROVINCIA", "DISTRITO", "LOCALIDAD"];

/**
 * A diferencia de categorías, el nivel y el padre requerido son
 * indisociables (GeographyLevel.requiredParentLevel — jerarquía fija,
 * CONTEXTO.md sección 5): elegir el nivel filtra automáticamente qué
 * unidades son padres válidos.
 */
export function GeographyCreateForm({ allUnits }: { allUnits: GeographicUnit[] }) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<GeographyLevel>("PAIS");
  const [parentId, setParentId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const candidates = parentCandidates(allUnits, level);
  const needsParent = level !== "PAIS";

  async function handleSubmit() {
    setPending(true);
    setError(null);
    const result = await createGeographyAction({ name, level, parentId: needsParent ? parentId || null : null });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
    }
    // Éxito: la Server Action redirige a /admin/geografia.
  }

  return (
    <div className="max-w-lg space-y-4">
      <FormField label="Nivel" name="level">
        <select
          value={level}
          onChange={(e) => {
            setLevel(e.target.value as GeographyLevel);
            setParentId("");
          }}
          className={formInputClass}
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {geographyLevelLabel(l)}
            </option>
          ))}
        </select>
      </FormField>

      {needsParent && (
        <FormField label={`${geographyLevelLabel(LEVELS[LEVELS.indexOf(level) - 1])} (padre)`} name="parentId">
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={formInputClass}>
            <option value="">Selecciona…</option>
            {candidates.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
          {candidates.length === 0 && (
            <span className="mt-1 block text-xs text-muted">
              Todavía no hay ninguna unidad de nivel {geographyLevelLabel(LEVELS[LEVELS.indexOf(level) - 1])} — créala primero.
            </span>
          )}
        </FormField>
      )}

      <FormField label="Nombre" name="name">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={formInputClass} />
      </FormField>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <AdminButton disabled={pending || !name.trim() || (needsParent && !parentId)} onClick={handleSubmit}>
        {pending ? "Creando…" : "Crear"}
      </AdminButton>
    </div>
  );
}

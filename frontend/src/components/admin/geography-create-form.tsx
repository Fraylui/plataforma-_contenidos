"use client";

import { useState } from "react";
import type { GeographicUnit, GeographyLevel } from "@/lib/api/types";
import { geographyLevelLabel } from "@/lib/content-labels";
import { parentCandidates } from "@/lib/admin/geography-tree";
import { createGeographyAction } from "@/app/admin/(protected)/geografia/actions";

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
      <label className="block text-sm font-medium text-foreground">
        Nivel
        <select
          value={level}
          onChange={(e) => {
            setLevel(e.target.value as GeographyLevel);
            setParentId("");
          }}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {geographyLevelLabel(l)}
            </option>
          ))}
        </select>
      </label>

      {needsParent && (
        <label className="block text-sm font-medium text-foreground">
          {geographyLevelLabel(LEVELS[LEVELS.indexOf(level) - 1])} (padre)
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
          >
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
        </label>
      )}

      <label className="block text-sm font-medium text-foreground">
        Nombre
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={pending || !name.trim() || (needsParent && !parentId)}
        onClick={handleSubmit}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear"}
      </button>
    </div>
  );
}

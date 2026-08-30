"use client";

import { useEffect, useState } from "react";
import type { GeographicUnit, GeographyLevel } from "@/lib/api/types";
import { createGeographyInlineAction } from "@/app/admin/(protected)/geografia/actions";

const NEW_OPTION_VALUE = "__new__";

const LEVELS: { level: GeographyLevel; label: string }[] = [
  { level: "PAIS", label: "País" },
  { level: "REGION", label: "Región" },
  { level: "PROVINCIA", label: "Provincia" },
  { level: "DISTRITO", label: "Distrito" },
  { level: "LOCALIDAD", label: "Localidad" },
];

async function fetchChildren(level: GeographyLevel, parentId: string | null): Promise<GeographicUnit[]> {
  const query = new URLSearchParams({ level });
  if (parentId) query.set("parentId", parentId);
  const res = await fetch(`/api/geography?${query.toString()}`);
  if (!res.ok) return [];
  return res.json() as Promise<GeographicUnit[]>;
}

/**
 * Selector en cascada País → Región → Provincia → Distrito → Localidad
 * (CONTEXTO.md sección 5). geographyId es opcional y puede apuntar a
 * cualquier nivel, no solo al más profundo — un artículo puede estar
 * asociado solo a nivel Región, por ejemplo.
 */
export function GeographyPicker({
  initialChain,
  onChange,
}: {
  initialChain: GeographicUnit[];
  onChange: (geographyId: string | null) => void;
}) {
  const [selected, setSelected] = useState<(GeographicUnit | null)[]>(() => {
    const chain: (GeographicUnit | null)[] = LEVELS.map(() => null);
    initialChain.forEach((unit, i) => {
      chain[i] = unit;
    });
    return chain;
  });
  const [options, setOptions] = useState<GeographicUnit[][]>(() => LEVELS.map(() => []));
  const [loading, setLoading] = useState(0);
  const [creatingLevel, setCreatingLevel] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // Carga las opciones del primer nivel al montar, y las del resto de la
  // cadena inicial (para poder mostrar el valor precargado en edición).
  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      setLoading((n) => n + 1);
      const nextOptions: GeographicUnit[][] = LEVELS.map(() => []);
      let parentId: string | null = null;
      for (let i = 0; i < LEVELS.length; i++) {
        const children = await fetchChildren(LEVELS[i].level, parentId);
        if (cancelled) return;
        nextOptions[i] = children;
        const currentSelection = selected[i];
        if (!currentSelection) break;
        parentId = currentSelection.id;
      }
      if (!cancelled) {
        setOptions(nextOptions);
        setLoading((n) => n - 1);
      }
    }
    loadInitial();
    return () => {
      cancelled = true;
    };
    // Solo al montar: la cadena inicial no cambia durante la vida del formulario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelect(levelIndex: number, unitId: string) {
    if (unitId === NEW_OPTION_VALUE) {
      setCreatingLevel(levelIndex);
      setNewName("");
      setCreateError(null);
      return;
    }
    const unit = options[levelIndex].find((u) => u.id === unitId) ?? null;

    const nextSelected = [...selected];
    nextSelected[levelIndex] = unit;
    for (let i = levelIndex + 1; i < LEVELS.length; i++) {
      nextSelected[i] = null;
    }
    setSelected(nextSelected);
    onChange(unit?.id ?? deepestSelectedId(nextSelected, levelIndex));

    if (unit && levelIndex + 1 < LEVELS.length) {
      setLoading((n) => n + 1);
      const children = await fetchChildren(LEVELS[levelIndex + 1].level, unit.id);
      setOptions((prev) => {
        const next = [...prev];
        next[levelIndex + 1] = children;
        for (let i = levelIndex + 2; i < LEVELS.length; i++) {
          next[i] = [];
        }
        return next;
      });
      setLoading((n) => n - 1);
    } else {
      setOptions((prev) => {
        const next = [...prev];
        for (let i = levelIndex + 1; i < LEVELS.length; i++) {
          next[i] = [];
        }
        return next;
      });
    }
  }

  async function handleCreate(levelIndex: number) {
    const name = newName.trim();
    if (!name) return;
    const parentId = levelIndex > 0 ? (selected[levelIndex - 1]?.id ?? null) : null;
    setLoading((n) => n + 1);
    setCreateError(null);
    const result = await createGeographyInlineAction({ name, level: LEVELS[levelIndex].level, parentId });
    setLoading((n) => n - 1);
    if (!result.ok) {
      setCreateError(result.error);
      return;
    }
    const unit = result.data;
    setOptions((prev) => {
      const next = [...prev];
      next[levelIndex] = [...next[levelIndex], unit];
      return next;
    });
    setCreatingLevel(null);
    const nextSelected = [...selected];
    nextSelected[levelIndex] = unit;
    for (let i = levelIndex + 1; i < LEVELS.length; i++) nextSelected[i] = null;
    setSelected(nextSelected);
    onChange(unit.id);
  }

  function handleClear() {
    setSelected(LEVELS.map(() => null));
    setOptions((prev) => [prev[0], [], [], [], []]);
    onChange(null);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {LEVELS.map((levelInfo, i) => {
          const disabled = i > 0 && !selected[i - 1];
          return (
            <select
              key={levelInfo.level}
              id={`geography-picker-${levelInfo.level.toLowerCase()}`}
              name={levelInfo.level.toLowerCase()}
              aria-label={levelInfo.label}
              disabled={disabled || loading > 0}
              value={selected[i]?.id ?? ""}
              onChange={(e) => handleSelect(i, e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus-visible:border-accent disabled:opacity-50"
            >
              <option value="">{levelInfo.label}…</option>
              {options[i].map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
              {!disabled && <option value={NEW_OPTION_VALUE}>+ Crear {levelInfo.label.toLowerCase()}…</option>}
            </select>
          );
        })}
      </div>

      {creatingLevel !== null && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="text"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`Nombre de ${LEVELS[creatingLevel].label.toLowerCase()} nueva`}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus-visible:border-accent"
          />
          <button
            type="button"
            disabled={!newName.trim() || loading > 0}
            onClick={() => handleCreate(creatingLevel)}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-50"
          >
            Crear
          </button>
          <button
            type="button"
            onClick={() => setCreatingLevel(null)}
            className="text-xs font-medium text-muted hover:text-foreground"
          >
            Cancelar
          </button>
          {createError && <p className="w-full text-xs text-red-600 dark:text-red-400">{createError}</p>}
        </div>
      )}

      {selected.some(Boolean) && (
        <button
          type="button"
          onClick={handleClear}
          className="mt-2 text-xs font-medium text-muted underline underline-offset-2 hover:text-accent"
        >
          Quitar ubicación
        </button>
      )}
    </div>
  );
}

function deepestSelectedId(chain: (GeographicUnit | null)[], upTo: number): string | null {
  for (let i = upTo; i >= 0; i--) {
    if (chain[i]) return chain[i]!.id;
  }
  return null;
}

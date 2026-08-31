"use client";

import { useEffect, useState } from "react";
import type { GeographicUnit, GeographyLevel } from "@/lib/api/types";
import { createGeographyInlineAction } from "@/app/admin/(protected)/geografia/actions";
import { Combobox } from "@/components/admin/ui";

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
  const [createError, setCreateError] = useState<{ level: number; message: string } | null>(null);

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

  async function handleSelect(levelIndex: number, unitId: string | null) {
    setCreateError(null);
    const unit = unitId ? (options[levelIndex].find((u) => u.id === unitId) ?? null) : null;

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

  async function handleCreate(levelIndex: number, name: string) {
    const parentId = levelIndex > 0 ? (selected[levelIndex - 1]?.id ?? null) : null;
    setLoading((n) => n + 1);
    setCreateError(null);
    const result = await createGeographyInlineAction({ name, level: LEVELS[levelIndex].level, parentId });
    setLoading((n) => n - 1);
    if (!result.ok) {
      setCreateError({ level: levelIndex, message: result.error });
      return;
    }
    const unit = result.data;
    setOptions((prev) => {
      const next = [...prev];
      next[levelIndex] = [...next[levelIndex], unit];
      return next;
    });
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
            <Combobox
              key={levelInfo.level}
              disabled={disabled || loading > 0}
              value={selected[i]?.id ?? null}
              onSelect={(id) => handleSelect(i, id)}
              options={options[i].map((unit) => ({ id: unit.id, label: unit.name }))}
              placeholder={`${levelInfo.label}…`}
              searchPlaceholder={`Buscar ${levelInfo.label.toLowerCase()}…`}
              emptyMessage={`Sin ${levelInfo.label.toLowerCase()}s creadas todavía.`}
              onCreateNew={(name) => handleCreate(i, name)}
              createNewLabel={(name) => `Crear ${levelInfo.label.toLowerCase()} "${name}"`}
            />
          );
        })}
      </div>

      {createError && <p className="mt-2 text-xs text-danger">{createError.message}</p>}

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

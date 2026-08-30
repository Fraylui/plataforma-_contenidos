"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Category, GeographicUnit, GeographyLevel } from "@/lib/api/types";

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
 * Filtro por Categoría + Ubicación geográfica para listados públicos — los
 * 6 endpoints de listado (`*PublicController.java`) aceptan `categoryId` y
 * `geographyId`, pero hasta esta revisión ninguna página pública ofrecía
 * forma de usarlos (solo existían a través de /categorias/[slug], sin
 * geografía en absoluto — justo el eje central del producto, CONTEXTO.md
 * sección 2/5). Dirigido por la URL (no estado de cliente aislado) para que
 * los resultados filtrados sean enlaces compartibles/con back del navegador,
 * mismo criterio que /buscar y /categorias/[slug].
 */
export function ListingFilters({
  basePath,
  categories,
  initialGeographyChain,
}: {
  basePath: string;
  categories: Category[];
  initialGeographyChain: GeographicUnit[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryId = searchParams.get("categoryId") ?? "";

  const [selected, setSelected] = useState<(GeographicUnit | null)[]>(() => {
    const chain: (GeographicUnit | null)[] = LEVELS.map(() => null);
    initialGeographyChain.forEach((unit, i) => {
      chain[i] = unit;
    });
    return chain;
  });
  const [options, setOptions] = useState<GeographicUnit[][]>(() => LEVELS.map(() => []));
  const [loading, setLoading] = useState(0);

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
    // Solo al montar: la cadena inicial viene de la URL en la primera carga.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function navigate(nextCategoryId: string, nextGeographyId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextCategoryId) params.set("categoryId", nextCategoryId);
    else params.delete("categoryId");
    if (nextGeographyId) params.set("geographyId", nextGeographyId);
    else params.delete("geographyId");
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : basePath);
  }

  async function handleGeographySelect(levelIndex: number, unitId: string) {
    const unit = options[levelIndex].find((u) => u.id === unitId) ?? null;

    const nextSelected = [...selected];
    nextSelected[levelIndex] = unit;
    for (let i = levelIndex + 1; i < LEVELS.length; i++) {
      nextSelected[i] = null;
    }
    setSelected(nextSelected);
    navigate(categoryId, unit?.id ?? deepestSelectedId(nextSelected, levelIndex));

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

  function handleClearGeography() {
    setSelected(LEVELS.map(() => null));
    setOptions((prev) => [prev[0], [], [], [], []]);
    navigate(categoryId, null);
  }

  const hasGeography = selected.some(Boolean);
  const selectClass =
    "w-full sm:w-auto rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus-visible:border-accent disabled:opacity-50";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-6 sm:gap-y-3">
      <div className="w-full sm:w-auto">
        <label htmlFor="listing-filter-category" className="sr-only">
          Filtrar por categoría
        </label>
        <select
          id="listing-filter-category"
          value={categoryId}
          onChange={(e) => navigate(e.target.value, deepestSelectedId(selected, LEVELS.length - 1))}
          className={selectClass}
        >
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full sm:w-auto">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {LEVELS.map((levelInfo, i) => {
            const disabled = i > 0 && !selected[i - 1];
            return (
              <select
                key={levelInfo.level}
                id={`listing-filter-${levelInfo.level.toLowerCase()}`}
                name={levelInfo.level.toLowerCase()}
                aria-label={levelInfo.label}
                disabled={disabled || loading > 0}
                value={selected[i]?.id ?? ""}
                onChange={(e) => handleGeographySelect(i, e.target.value)}
                className={selectClass}
              >
                <option value="">{levelInfo.label}…</option>
                {options[i].map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            );
          })}
        </div>
        {hasGeography && (
          <button
            type="button"
            onClick={handleClearGeography}
            className="mt-1.5 text-xs font-medium text-muted underline underline-offset-2 hover:text-accent"
          >
            Quitar ubicación
          </button>
        )}
      </div>
    </div>
  );
}

function deepestSelectedId(chain: (GeographicUnit | null)[], upTo: number): string | null {
  for (let i = upTo; i >= 0; i--) {
    if (chain[i]) return chain[i]!.id;
  }
  return null;
}

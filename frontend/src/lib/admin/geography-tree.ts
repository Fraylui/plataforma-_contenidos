import type { GeographicUnit, GeographyLevel } from "@/lib/api/types";
import { flattenTree } from "./tree";

const LEVEL_ORDER: GeographyLevel[] = ["PAIS", "REGION", "PROVINCIA", "DISTRITO", "LOCALIDAD"];

export function levelDepth(level: GeographyLevel): number {
  return LEVEL_ORDER.indexOf(level);
}

/**
 * Aplana la jerarquía geográfica fija (CONTEXTO.md sección 5) en una lista
 * padre→hijos para mostrarla indentada en una tabla plana. A diferencia de
 * categorías, la profundidad viene dada por el nivel (enum fijo), no hay
 * que calcularla recorriendo el árbol.
 */
export function sortGeographyHierarchically(units: GeographicUnit[]): { unit: GeographicUnit; depth: number }[] {
  return flattenTree(
    units,
    (a, b) => a.name.localeCompare(b.name),
    (unit) => levelDepth(unit.level),
  ).map(({ item, depth }) => ({ unit: item, depth }));
}

/** Padres válidos para crear una unidad de `level`: todas las unidades del nivel inmediatamente superior. */
export function parentCandidates(units: GeographicUnit[], level: GeographyLevel): GeographicUnit[] {
  const depth = levelDepth(level);
  if (depth <= 0) return [];
  const requiredParentLevel = LEVEL_ORDER[depth - 1];
  return units.filter((u) => u.level === requiredParentLevel).sort((a, b) => a.name.localeCompare(b.name));
}

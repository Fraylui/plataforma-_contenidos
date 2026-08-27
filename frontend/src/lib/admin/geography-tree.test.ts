import { describe, expect, it } from "vitest";
import { levelDepth, parentCandidates, sortGeographyHierarchically } from "./geography-tree";
import type { GeographicUnit, GeographyLevel } from "@/lib/api/types";

function makeUnit(overrides: Partial<GeographicUnit> = {}): GeographicUnit {
  return {
    id: "unit-1",
    name: "Unidad",
    slug: "unidad",
    level: "PAIS",
    parentId: null,
    active: true,
    ...overrides,
  };
}

describe("levelDepth", () => {
  it.each<[GeographyLevel, number]>([
    ["PAIS", 0],
    ["REGION", 1],
    ["PROVINCIA", 2],
    ["DISTRITO", 3],
    ["LOCALIDAD", 4],
  ])("%s tiene profundidad %i", (level, depth) => {
    expect(levelDepth(level)).toBe(depth);
  });
});

describe("sortGeographyHierarchically", () => {
  it("usa el nivel para la profundidad, no la posición en el árbol", () => {
    const units = [
      makeUnit({ id: "peru", name: "Perú", level: "PAIS" }),
      makeUnit({ id: "ayacucho", name: "Ayacucho", level: "REGION", parentId: "peru" }),
      makeUnit({ id: "huamanga", name: "Huamanga", level: "PROVINCIA", parentId: "ayacucho" }),
    ];
    const result = sortGeographyHierarchically(units);
    expect(result.map((r) => ({ id: r.unit.id, depth: r.depth }))).toEqual([
      { id: "peru", depth: 0 },
      { id: "ayacucho", depth: 1 },
      { id: "huamanga", depth: 2 },
    ]);
  });

  it("ordena hermanos alfabéticamente", () => {
    const units = [
      makeUnit({ id: "b", name: "Bravo", level: "REGION", parentId: "root" }),
      makeUnit({ id: "a", name: "Alpha", level: "REGION", parentId: "root" }),
      makeUnit({ id: "root", name: "Perú", level: "PAIS" }),
    ];
    const result = sortGeographyHierarchically(units).map((r) => r.unit.id);
    expect(result).toEqual(["root", "a", "b"]);
  });
});

describe("parentCandidates", () => {
  const units = [
    makeUnit({ id: "peru", name: "Perú", level: "PAIS" }),
    makeUnit({ id: "ayacucho", name: "Ayacucho", level: "REGION", parentId: "peru" }),
    makeUnit({ id: "lima", name: "Lima", level: "REGION", parentId: "peru" }),
    makeUnit({ id: "huamanga", name: "Huamanga", level: "PROVINCIA", parentId: "ayacucho" }),
  ];

  it("para PAIS (nivel 0) no hay padres válidos", () => {
    expect(parentCandidates(units, "PAIS")).toEqual([]);
  });

  it("para REGION, los padres válidos son los PAIS existentes", () => {
    const result = parentCandidates(units, "REGION");
    expect(result.map((u) => u.id)).toEqual(["peru"]);
  });

  it("para PROVINCIA, los padres válidos son las REGION, ordenadas por nombre", () => {
    const result = parentCandidates(units, "PROVINCIA");
    expect(result.map((u) => u.id)).toEqual(["ayacucho", "lima"]);
  });

  it("nunca ofrece una unidad de un nivel salteado (ej. PROVINCIA como padre de LOCALIDAD)", () => {
    // No hay DISTRITO en `units`: LOCALIDAD exige exactamente el nivel
    // inmediatamente superior, así que no debe caer de vuelta a PROVINCIA.
    const result = parentCandidates(units, "LOCALIDAD");
    expect(result).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { categoryParentOptions, sortCategoriesHierarchically } from "./category-tree";
import type { Category } from "@/lib/api/types";

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "cat-1",
    name: "Categoría",
    slug: "categoria",
    description: null,
    parentId: null,
    active: true,
    sortOrder: 0,
    ...overrides,
  };
}

describe("sortCategoriesHierarchically", () => {
  it("ordena por sortOrder y desempata por nombre", () => {
    const categories = [
      makeCategory({ id: "b", name: "Bravo", sortOrder: 1 }),
      makeCategory({ id: "a", name: "Alpha", sortOrder: 1 }),
      makeCategory({ id: "c", name: "Charlie", sortOrder: 0 }),
    ];
    const result = sortCategoriesHierarchically(categories).map((r) => r.category.id);
    expect(result).toEqual(["c", "a", "b"]);
  });
});

describe("categoryParentOptions", () => {
  const categories = [
    makeCategory({ id: "root", name: "Raíz", parentId: null }),
    makeCategory({ id: "child", name: "Hijo", parentId: "root" }),
    makeCategory({ id: "grandchild", name: "Nieto", parentId: "child" }),
    makeCategory({ id: "unrelated", name: "Otra rama", parentId: null }),
  ];

  it("sin excludeId, devuelve todas las categorías", () => {
    const result = categoryParentOptions(categories);
    expect(result.map((r) => r.id).sort()).toEqual(["child", "grandchild", "root", "unrelated"]);
  });

  it("excluye la propia categoría y TODOS sus descendientes (evita ciclos)", () => {
    // Elegir "child" o "grandchild" como padre de "root" formaría un ciclo
    // — es justo lo que esta función tiene que impedir en la UI.
    const result = categoryParentOptions(categories, "root");
    expect(result.map((r) => r.id).sort()).toEqual(["unrelated"]);
  });

  it("excluyendo un nodo intermedio, solo se pierde su propio subárbol", () => {
    const result = categoryParentOptions(categories, "child");
    expect(result.map((r) => r.id).sort()).toEqual(["root", "unrelated"]);
  });

  it("una hoja sin hijos solo se excluye a sí misma", () => {
    const result = categoryParentOptions(categories, "grandchild");
    expect(result.map((r) => r.id).sort()).toEqual(["child", "root", "unrelated"]);
  });
});

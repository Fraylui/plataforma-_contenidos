import type { Category } from "@/lib/api/types";
import { flattenTree } from "./tree";

/**
 * Aplana el árbol de categorías (CONTEXTO.md sección 4: "categorías y
 * subcategorías ilimitadas") en una lista ordenada padre→hijos, con la
 * profundidad de cada una para poder indentarla en una tabla plana.
 */
export function sortCategoriesHierarchically(categories: Category[]): { category: Category; depth: number }[] {
  return flattenTree(categories, (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)).map(
    ({ item, depth }) => ({ category: item, depth }),
  );
}

/**
 * Candidatos válidos a "padre" al editar `excludeId`: todas menos ella misma
 * y sus descendientes (elegir un descendiente como padre formaría un ciclo
 * — el backend también lo valida, esto es solo para no ofrecerlo en la UI).
 */
export function categoryParentOptions(
  categories: Category[],
  excludeId?: string,
): { id: string; depth: number; name: string }[] {
  const excluded = new Set<string>();
  if (excludeId) {
    excluded.add(excludeId);
    let added = true;
    while (added) {
      added = false;
      for (const category of categories) {
        if (category.parentId && excluded.has(category.parentId) && !excluded.has(category.id)) {
          excluded.add(category.id);
          added = true;
        }
      }
    }
  }
  return sortCategoriesHierarchically(categories.filter((c) => !excluded.has(c.id))).map(({ category, depth }) => ({
    id: category.id,
    depth,
    name: category.name,
  }));
}

interface TreeNode {
  id: string;
  parentId: string | null;
}

/**
 * Aplana cualquier jerarquía padre→hijos (categorías, geografía) en una
 * lista ordenada con profundidad, para mostrarla indentada en una tabla
 * plana. category-tree.ts y geography-tree.ts implementaban esto cada uno
 * por su cuenta con la misma lógica — unificado acá tras encontrarlo
 * duplicado en la revisión de código de esta fase. `depthOf` es opcional:
 * geografía tiene niveles fijos (el nivel YA determina la profundidad, sin
 * necesidad de recorrer el árbol); categorías no, así que usan la
 * profundidad de recorrido por defecto.
 */
export function flattenTree<T extends TreeNode>(
  items: T[],
  compareSiblings: (a: T, b: T) => number,
  depthOf?: (item: T) => number,
): { item: T; depth: number }[] {
  const byParent = new Map<string | null, T[]>();
  for (const item of items) {
    const siblings = byParent.get(item.parentId) ?? [];
    siblings.push(item);
    byParent.set(item.parentId, siblings);
  }
  for (const siblings of byParent.values()) {
    siblings.sort(compareSiblings);
  }

  const result: { item: T; depth: number }[] = [];
  const visited = new Set<string>();

  function visit(parentId: string | null, depth: number) {
    for (const item of byParent.get(parentId) ?? []) {
      if (visited.has(item.id)) continue;
      visited.add(item.id);
      result.push({ item, depth: depthOf ? depthOf(item) : depth });
      visit(item.id, depth + 1);
    }
  }
  visit(null, 0);

  // Huérfanas (parentId apunta a algo fuera de `items`, ej. inactivo y
  // filtrado aguas arriba): se muestran igual, al final.
  for (const item of items) {
    if (!visited.has(item.id)) {
      result.push({ item, depth: depthOf ? depthOf(item) : 0 });
    }
  }
  return result;
}

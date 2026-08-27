import { describe, expect, it } from "vitest";
import { flattenTree } from "./tree";

interface Node {
  id: string;
  parentId: string | null;
  name: string;
}

function node(id: string, parentId: string | null, name = id): Node {
  return { id, parentId, name };
}

const byName = (a: Node, b: Node) => a.name.localeCompare(b.name);

describe("flattenTree", () => {
  it("ordena una jerarquía simple en preorder (padre antes que hijos)", () => {
    const items = [node("b", null), node("a", null), node("a1", "a"), node("a2", "a"), node("b1", "b")];
    const result = flattenTree(items, byName).map((r) => r.item.id);
    expect(result).toEqual(["a", "a1", "a2", "b", "b1"]);
  });

  it("calcula la profundidad por recorrido cuando no se pasa depthOf", () => {
    const items = [node("root", null), node("child", "root"), node("grandchild", "child")];
    const result = flattenTree(items, byName);
    expect(result.map((r) => r.depth)).toEqual([0, 1, 2]);
  });

  it("usa depthOf cuando se provee, en vez de la profundidad de recorrido", () => {
    const items = [node("a", null), node("b", "a")];
    const result = flattenTree(items, byName, (item) => (item.id === "a" ? 10 : 20));
    expect(result.map((r) => r.depth)).toEqual([10, 20]);
  });

  it("respeta compareSiblings entre hermanos del mismo padre", () => {
    const items = [node("z", "root"), node("a", "root"), node("root", null)];
    const result = flattenTree(items, byName).map((r) => r.item.id);
    expect(result).toEqual(["root", "a", "z"]);
  });

  it("muestra los huérfanos al final en vez de perderlos", () => {
    // "huerfano" apunta a un parentId que no existe en `items` (filtrado
    // aguas arriba, ej. inactivo) — comentario en tree.ts.
    const items = [node("root", null), node("huerfano", "no-existe")];
    const result = flattenTree(items, byName).map((r) => r.item.id);
    expect(result).toEqual(["root", "huerfano"]);
  });

  it("no entra en loop infinito si hay un ciclo (parentId circular)", () => {
    // Un ciclo real sería un bug de datos (el backend valida contra esto),
    // pero la UI no debe colgarse si igual llega — termina y ambos quedan
    // como huérfanos (ninguno es alcanzable desde la raíz null).
    const items = [node("a", "b"), node("b", "a")];
    const result = flattenTree(items, byName);
    expect(result.map((r) => r.item.id).sort()).toEqual(["a", "b"]);
  });
});

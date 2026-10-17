import { describe, expect, it } from "vitest";
import { splitBodyInHalf } from "./split-body";

const p = (n: number) => Array.from({ length: n }, (_, i) => `<p>Párrafo ${i + 1}</p>`).join("");

describe("splitBodyInHalf", () => {
  it("un texto corto queda entero", () => {
    expect(splitBodyInHalf(p(5))).toBeNull();
  });

  it("parte un texto largo por la mitad, en un borde de párrafo", () => {
    const [first, second] = splitBodyInHalf(p(8))!;
    expect(first).toBe(p(4));
    expect(first + second).toBe(p(8));
  });

  it("nunca corta dentro de una lista o una cita", () => {
    const html = `${p(2)}<ul><li><p>a</p></li><li><p>b</p></li><li><p>c</p></li></ul><blockquote><p>cita</p></blockquote>${p(3)}`;
    const [first, second] = splitBodyInHalf(html)!;
    expect(first.match(/<ul>/g)?.length ?? 0).toBe(first.match(/<\/ul>/g)?.length ?? 0);
    expect(first.match(/<blockquote>/g)?.length ?? 0).toBe(first.match(/<\/blockquote>/g)?.length ?? 0);
    expect(first + second).toBe(html);
  });

  it("no deja un subtítulo separado de su texto", () => {
    const html = `${p(3)}<h2>Sección</h2>${p(3)}`;
    const [first] = splitBodyInHalf(html)!;
    expect(first.endsWith("</h2>")).toBe(false);
  });
});

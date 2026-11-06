import { describe, expect, it } from "vitest";
import { findTemplate, PUBLICATION_TEMPLATES } from "./publication-templates";

const ALLOWED = new Set(["p", "br", "strong", "em", "u", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "img"]);

describe("plantillas de publicación", () => {
  it("solo usan etiquetas que el backend deja pasar (HtmlSanitizer)", () => {
    for (const template of PUBLICATION_TEMPLATES) {
      const tags = [...template.body.matchAll(/<\/?([a-z0-9]+)/g)].map((m) => m[1]);
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.filter((tag) => !ALLOWED.has(tag))).toEqual([]);
    }
  });

  it("se eligen por la URL; cualquier otro valor es «en blanco»", () => {
    expect(findTemplate("lista")?.type).toBe("LISTA");
    expect(findTemplate(["guia"])?.type).toBe("GUIA");
    expect(findTemplate("noticia")).toBeUndefined();
    expect(findTemplate(undefined)).toBeUndefined();
  });

  it("no usan lenguaje de periódico", () => {
    const text = PUBLICATION_TEMPLATES.map((t) => `${t.label} ${t.description} ${t.body}`).join(" ").toLowerCase();
    expect(text).not.toMatch(/noticia|periódico|periodismo|crónica|reportaje|redacción|titular|editorial/);
  });
});

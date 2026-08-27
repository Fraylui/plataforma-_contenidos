import { describe, expect, it } from "vitest";
import {
  articleStatusLabel,
  articleStatusTone,
  articleTypeLabel,
  formatPublishedDate,
  geographyLevelLabel,
} from "./content-labels";
import type { ArticleStatus, ArticleType, GeographyLevel } from "@/lib/api/types";

const ALL_ARTICLE_TYPES: ArticleType[] = [
  "ARTICULO",
  "NOTICIA",
  "REPORTAJE",
  "CRONICA",
  "GUIA",
  "ENTREVISTA",
  "HISTORIA",
  "RANKING",
  "RESENA",
  "TUTORIAL",
  "OPINION",
];

const ALL_ARTICLE_STATUSES: ArticleStatus[] = [
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
  "REJECTED",
];

const ALL_GEOGRAPHY_LEVELS: GeographyLevel[] = ["PAIS", "REGION", "PROVINCIA", "DISTRITO", "LOCALIDAD"];

// Sobre todo para que un nuevo valor del enum (backend) que se olvide
// agregar acá explote en un test en vez de mostrar `undefined` en la UI.
describe("mapas de etiquetas", () => {
  it.each(ALL_ARTICLE_TYPES)("articleTypeLabel(%s) devuelve una etiqueta no vacía", (type) => {
    expect(articleTypeLabel(type)).toBeTruthy();
  });

  it.each(ALL_ARTICLE_STATUSES)("articleStatusLabel(%s) y articleStatusTone(%s) están definidos", (status) => {
    expect(articleStatusLabel(status)).toBeTruthy();
    expect(["neutral", "warning", "success", "danger"]).toContain(articleStatusTone(status));
  });

  it.each(ALL_GEOGRAPHY_LEVELS)("geographyLevelLabel(%s) devuelve una etiqueta no vacía", (level) => {
    expect(geographyLevelLabel(level)).toBeTruthy();
  });

  it("PUBLISHED es el único estado con tono success", () => {
    const successStatuses = ALL_ARTICLE_STATUSES.filter((s) => articleStatusTone(s) === "success");
    expect(successStatuses).toEqual(["PUBLISHED"]);
  });

  it("REJECTED es el único estado con tono danger", () => {
    const dangerStatuses = ALL_ARTICLE_STATUSES.filter((s) => articleStatusTone(s) === "danger");
    expect(dangerStatuses).toEqual(["REJECTED"]);
  });
});

describe("formatPublishedDate", () => {
  it("devuelve cadena vacía para null (artículo sin publicar)", () => {
    expect(formatPublishedDate(null)).toBe("");
  });

  it("formatea una fecha ISO en español (es-PE)", () => {
    // Mediodía UTC, no medianoche: evita que el resultado cambie de día
    // según la zona horaria local de quien corre el test.
    expect(formatPublishedDate("2026-03-15T12:00:00Z")).toBe("15 de marzo de 2026");
  });
});

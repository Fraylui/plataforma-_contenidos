import { describe, expect, it } from "vitest";
import { articleTypeLabel, formatPublishedDate, publicationStatusLabel, publicationStatusTone } from "./content-labels";
import type { ArticleType, PublicationStatus } from "@/lib/api/types";

const ALL_ARTICLE_TYPES: ArticleType[] = ["GENERAL", "GUIA", "LISTA", "TUTORIAL", "HISTORIA", "ENTREVISTA"];

const ALL_STATUSES: PublicationStatus[] = ["DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"];

// Sobre todo para que un nuevo valor del enum (backend) que se olvide
// agregar acá explote en un test en vez de mostrar `undefined` en la UI.
describe("mapas de etiquetas", () => {
  it.each(ALL_ARTICLE_TYPES)("articleTypeLabel(%s) devuelve una etiqueta no vacía", (type) => {
    expect(articleTypeLabel(type)).toBeTruthy();
  });

  it("formatos de plataforma, sin géneros periodísticos", () => {
    expect(ALL_ARTICLE_TYPES.map(articleTypeLabel)).toEqual(["General", "Guía", "Lista", "Tutorial", "Historia", "Entrevista"]);
  });

  it("estados de plataforma, sin pasos de redacción", () => {
    expect(ALL_STATUSES.map(publicationStatusLabel)).toEqual([
      "Borrador",
      "Pendiente de aprobación",
      "Programado",
      "Publicado",
      "Archivado",
    ]);
  });

  it("cada estado tiene su color y solo lo publicado es verde de éxito", () => {
    expect(ALL_STATUSES.map(publicationStatusTone)).toEqual(["neutral", "info", "warning", "success", "neutral"]);
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

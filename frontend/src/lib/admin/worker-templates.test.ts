import { describe, expect, it } from "vitest";
import { WORKER_TEMPLATES, detectTemplate } from "./worker-templates";

/** Deben coincidir con Templates.java (spec 2a §3.4). */
describe("plantillas de trabajador", () => {
  it("mismos permisos que el backend", () => {
    expect(Object.fromEntries(WORKER_TEMPLATES.map((t) => [t.id, t.permissions]))).toEqual({
      ADMINISTRADOR: {
        PUBLICATIONS: "PUBLISH", PLACES: "PUBLISH", CELEBRATIONS: "PUBLISH", GALLERIES: "PUBLISH",
        SERIES: "PUBLISH", CATEGORIES: "ACCESS", STATS: "ACCESS", ADVERTISING: "ACCESS", WORKERS: "ACCESS", SETTINGS: "ACCESS",
      },
      PUBLICADOR: {
        PUBLICATIONS: "PUBLISH", PLACES: "PUBLISH", CELEBRATIONS: "PUBLISH", GALLERIES: "PUBLISH",
        SERIES: "PUBLISH", CATEGORIES: "ACCESS", STATS: "ACCESS",
      },
      GESTOR_CELEBRACIONES: { CELEBRATIONS: "PUBLISH", PLACES: "PUBLISH" },
      PUBLICIDAD: { ADVERTISING: "ACCESS", STATS: "ACCESS" },
    });
    expect(WORKER_TEMPLATES.map((t) => t.label)).toEqual(["Administrador", "Publicador", "Gestor de celebraciones", "Publicidad"]);
  });

  it("reconoce la plantilla de un conjunto de permisos, o «Personalizado»", () => {
    expect(detectTemplate({ CELEBRATIONS: "PUBLISH", PLACES: "PUBLISH" })).toBe("Gestor de celebraciones");
    expect(detectTemplate({ CELEBRATIONS: "PUBLISH" })).toBe("Personalizado");
    expect(detectTemplate({})).toBe("Sin permisos");
  });
});

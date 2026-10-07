import { describe, expect, it } from "vitest";
import { WORKER_TEMPLATES, detectTemplate } from "./worker-templates";

/** Deben coincidir con Templates.java (spec 2a §3.4). */
describe("plantillas de trabajador", () => {
  it("mismos permisos que el backend", () => {
    expect(Object.fromEntries(WORKER_TEMPLATES.map((t) => [t.id, t.permissions]))).toEqual({
      CREADOR: { ARTICLES: "CREATE", PLACES: "CREATE", EVENTS: "CREATE", GALLERIES: "CREATE", DIRECTORY: "CREATE" },
      PUBLICADOR: {
        ARTICLES: "PUBLISH", PLACES: "PUBLISH", EVENTS: "PUBLISH", GALLERIES: "PUBLISH", DIRECTORY: "PUBLISH",
        CATEGORIES: "ACCESS", STATS: "ACCESS",
      },
      GESTOR_EVENTOS: { EVENTS: "PUBLISH", PLACES: "PUBLISH" },
      GESTOR_DIRECTORIO: { DIRECTORY: "PUBLISH", PLACES: "PUBLISH" },
      PUBLICIDAD: { ADVERTISING: "ACCESS", STATS: "ACCESS" },
    });
    expect(WORKER_TEMPLATES.map((t) => t.label)).toEqual(["Creador", "Publicador", "Gestor de eventos", "Gestor de directorio", "Publicidad"]);
  });

  it("reconoce la plantilla de un conjunto de permisos, o «Personalizado»", () => {
    expect(detectTemplate({ EVENTS: "PUBLISH", PLACES: "PUBLISH" })).toBe("Gestor de eventos");
    expect(detectTemplate({ EVENTS: "PUBLISH" })).toBe("Personalizado");
    expect(detectTemplate({})).toBe("Sin permisos");
  });
});

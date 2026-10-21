import { describe, expect, it } from "vitest";
import { adContextQuery, anchorAdAllowed, sectionFromPath } from "./ad-context";

describe("sectionFromPath", () => {
  it("reconoce cada sección, en el listado y en el detalle", () => {
    expect(sectionFromPath("/")).toBe("HOME");
    expect(sectionFromPath("/lugares")).toBe("PLACE");
    expect(sectionFromPath("/celebraciones/feria-de-santa-ana")).toBe("CELEBRATION");
  });

  it("Series y En vivo comparten la sección de videos", () => {
    expect(sectionFromPath("/series")).toBe("SERIES");
    expect(sectionFromPath("/series/viajes/episodio-1")).toBe("SERIES");
    expect(sectionFromPath("/en-vivo")).toBe("SERIES");
  });

  it("no confunde prefijos ni inventa sección", () => {
    expect(sectionFromPath("/lugaresx")).toBeUndefined();
    expect(sectionFromPath("/buscar")).toBeUndefined();
  });
});

describe("adContextQuery", () => {
  it("solo agrega lo que hay", () => {
    expect(adContextQuery({})).toBe("");
    expect(adContextQuery({ section: "PLACE", categoryId: "abc" })).toBe("&section=PLACE&categoryId=abc");
  });
});

describe("anchorAdAllowed", () => {
  it("en el detalle de un contenido no va el anuncio fijo: ya hay uno dentro del texto (decisión del dueño 2026-10-21)", () => {
    expect(anchorAdAllowed("/publicaciones/mercado-de-huamanga")).toBe(false);
    expect(anchorAdAllowed("/lugares/mirador")).toBe(false);
    expect(anchorAdAllowed("/galerias/atardeceres")).toBe(false);
    expect(anchorAdAllowed("/celebraciones/fiestas-patrias")).toBe(false);
  });

  it("en listados, inicio y demás sí", () => {
    expect(anchorAdAllowed("/")).toBe(true);
    expect(anchorAdAllowed("/publicaciones")).toBe(true);
    expect(anchorAdAllowed("/explorar")).toBe(true);
    expect(anchorAdAllowed("/series/viajes/episodio-1")).toBe(true);
  });
});

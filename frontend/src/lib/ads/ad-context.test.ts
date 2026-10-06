import { describe, expect, it } from "vitest";
import { adContextQuery, sectionFromPath } from "./ad-context";

describe("sectionFromPath", () => {
  it("reconoce cada sección, en el listado y en el detalle", () => {
    expect(sectionFromPath("/")).toBe("HOME");
    expect(sectionFromPath("/lugares")).toBe("PLACE");
    expect(sectionFromPath("/eventos/feria-de-santa-ana")).toBe("EVENT");
    expect(sectionFromPath("/directorio/hostal-plaza")).toBe("BUSINESS");
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

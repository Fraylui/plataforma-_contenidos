// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { bodyField } from "./schema";

describe("bodyField", () => {
  it("etiquetas vacías del editor no cuentan como texto", () => {
    expect(bodyField.safeParse("<p></p>").success).toBe(false);
    expect(bodyField.safeParse("<p> <br></p>").success).toBe(false);
  });

  it("cualquier texto visible cuenta", () => {
    expect(bodyField.safeParse("<p>Hola</p>").success).toBe(true);
    expect(bodyField.safeParse("<h2>Ruta</h2>").success).toBe(true);
  });
});

describe("post sin texto largo", () => {
  it("basta con fotos o un video; vacío del todo, no", async () => {
    const { hasSomethingToShow } = await import("./schema");
    expect(hasSomethingToShow("", [{ imageId: "i1" }], [])).toBe(true);
    expect(hasSomethingToShow("<p></p>", [], [{ url: "https://youtu.be/x" }])).toBe(true);
    expect(hasSomethingToShow("<p>Hola</p>", [], [])).toBe(true);
    expect(hasSomethingToShow("<p> </p>", [], [])).toBe(false);
  });
});

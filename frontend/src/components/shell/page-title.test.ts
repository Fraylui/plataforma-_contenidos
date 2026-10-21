import { describe, expect, it } from "vitest";
import { backHref } from "./page-title";

// Sin títulos de pantalla en la franja superior (dueño 2026-10-21: «arriba de los contenidos se ven feos»);
// solo la flecha para volver, y a dónde lleva.
describe("backHref", () => {
  it("pestañas y secciones: sin flecha", () => {
    for (const path of ["/", "/explorar", "/buscar", "/celebraciones", "/lugares", "/publicaciones", "/series", "/en-vivo"]) {
      expect(backHref(path)).toBeNull();
    }
  });

  it("detalle: vuelve a su sección (un tema, al inicio)", () => {
    expect(backHref("/lugares/mirador")).toBe("/lugares");
    expect(backHref("/celebraciones/feria")).toBe("/celebraciones");
    expect(backHref("/publicaciones/ruta")).toBe("/publicaciones");
    expect(backHref("/categorias/turismo")).toBe("/");
  });

  it("páginas legales y desconocidas: vuelven al inicio", () => {
    expect(backHref("/privacidad")).toBe("/");
    expect(backHref("/algo-raro")).toBe("/");
  });
});

import { describe, expect, it } from "vitest";
import { problemMessage } from "./problem";

describe("problemMessage (RFC 9457)", () => {
  it("muestra el detalle del error", () => {
    expect(problemMessage({ title: "Conflicto", status: 409, detail: "No se puede publicar: está Archivado." }, 409)).toBe(
      "No se puede publicar: está Archivado.",
    );
  });

  it("agrega qué campo falló en la validación", () => {
    const body = {
      title: "Solicitud inválida",
      status: 400,
      detail: "Revisa los datos enviados.",
      errors: [{ field: "title", message: "no debe estar vacío" }],
    };
    expect(problemMessage(body, 400)).toBe("Revisa los datos enviados. (title: no debe estar vacío)");
  });

  it("sin cuerpo legible, dice el estado", () => {
    expect(problemMessage(null, 502)).toBe("Error del servidor (502)");
    expect(problemMessage({ title: "Sin permiso", status: 403 }, 403)).toBe("Sin permiso");
  });
});

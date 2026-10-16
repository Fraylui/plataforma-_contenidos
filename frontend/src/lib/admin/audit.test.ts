import { describe, expect, it } from "vitest";
import { describeAuditAction, parseAuditDetails } from "./audit";

describe("describeAuditAction", () => {
  it("traduce los códigos del backend a frases en español", () => {
    expect(describeAuditAction("EVENT_PUBLISHED")).toBe("Publicó una fecha");
    expect(describeAuditAction("ARTICLE_RETURNED_TO_DRAFT")).toBe("Devolvió a borrador una publicación");
    expect(describeAuditAction("WORKER_DEACTIVATED")).toBe("Desactivó a un trabajador");
    expect(describeAuditAction("LOGIN_FAILURE")).toBe("Intento de inicio de sesión fallido");
    expect(describeAuditAction("ACCESS_DENIED")).toBe("Intentó entrar a algo sin permiso");
    expect(describeAuditAction("GALLERY_PUBLISHED_FROM_SCHEDULE")).toBe("Publicó una galería a la hora programada");
  });

  it("las acciones del interceptor del panel se leen como ruta", () => {
    expect(describeAuditAction("DELETE /api/v1/admin/categories/{id}")).toBe("Borrado en categories");
  });

  it("un código desconocido se muestra legible", () => {
    expect(describeAuditAction("SOMETHING_NEW")).toBe("Something new");
  });
});

describe("parseAuditDetails", () => {
  it("convierte el antes → después de permisos", () => {
    expect(parseAuditDetails("ARTICLES: CREATE → PUBLISH; STATS: — → ACCESS")).toEqual([
      { kind: "change", label: "Publicaciones", from: "Crear", to: "Publicar" },
      { kind: "change", label: "Estadísticas", from: "Sin acceso", to: "Acceso" },
    ]);
  });

  it("lo que no tiene ese formato queda como texto; vacío no muestra nada", () => {
    expect(parseAuditDetails("borradas 12 filas")).toEqual([{ kind: "text", text: "borradas 12 filas" }]);
    expect(parseAuditDetails(null)).toEqual([]);
  });
});

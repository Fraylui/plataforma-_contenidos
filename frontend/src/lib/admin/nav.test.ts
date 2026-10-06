import { describe, expect, it } from "vitest";
import type { AdminUser } from "@/lib/api/admin-types";
import { ADMIN_NAV_GROUP_LABELS, groupedNavItems, visibleNavItems } from "./nav";

function user(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: "u1",
    email: "u@test.local",
    firstName: "U",
    lastName: "T",
    role: "WORKER",
    mustChangePassword: false,
    permissions: {},
    ...overrides,
  };
}

describe("menú del panel según permisos (espejo del servidor)", () => {
  it("un trabajador solo con Eventos ve Inicio, Eventos, Imágenes y Mi cuenta", () => {
    const labels = visibleNavItems(user({ permissions: { EVENTS: "CREATE" } })).map((i) => i.label);
    expect(labels).toEqual(["Inicio", "Eventos", "Imágenes", "Mi cuenta"]);
  });

  it("las secciones del dueño no aparecen para un trabajador con todos los módulos", () => {
    const all = user({
      permissions: {
        ARTICLES: "PUBLISH", PLACES: "PUBLISH", EVENTS: "PUBLISH", GALLERIES: "PUBLISH", DIRECTORY: "PUBLISH",
        CATEGORIES: "ACCESS", STATS: "ACCESS", ADVERTISING: "ACCESS",
      },
    });
    const hrefs = visibleNavItems(all).map((i) => i.href);
    expect(hrefs).not.toContain("/admin/trabajadores");
    expect(hrefs).not.toContain("/admin/configuracion");
    expect(hrefs).not.toContain("/admin/actividad");
  });
});

describe("lenguaje de plataforma (no de redacción)", () => {
  it("grupos y secciones del menú del dueño con nombres de plataforma", () => {
    const menu = groupedNavItems(user({ role: "OWNER" })).map(({ group, items }) => [ADMIN_NAV_GROUP_LABELS[group], items.map((i) => i.label)]);
    expect(menu).toEqual([
      [null, ["Inicio", "Estadísticas"]],
      ["Contenido", ["Publicaciones", "Lugares", "Eventos", "Galerías", "Directorio", "Temas", "Imágenes"]],
      ["Publicidad", ["Espacios publicitarios", "Anunciantes"]],
      ["Equipo y ajustes", ["Trabajadores", "Configuración", "Registro de actividad", "Mi cuenta"]],
    ]);
  });
});

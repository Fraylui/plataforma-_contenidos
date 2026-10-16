import { describe, expect, it } from "vitest";
import type { AdminUser } from "@/lib/api/admin-types";
import { ADMIN_NAV_GROUP_LABELS, createItems, groupedNavItems, visibleNavItems } from "./nav";

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
  it("un trabajador solo con Celebraciones ve Inicio, Celebraciones, Imágenes y Mi cuenta", () => {
    const labels = visibleNavItems(user({ permissions: { CELEBRATIONS: "PUBLISH" } })).map((i) => i.label);
    expect(labels).toEqual(["Inicio", "Celebraciones", "Imágenes", "Mi cuenta"]);
  });

  it("las secciones del dueño no aparecen para un trabajador con todos los módulos", () => {
    const all = user({
      permissions: {
        PUBLICATIONS: "PUBLISH", PLACES: "PUBLISH", CELEBRATIONS: "PUBLISH", GALLERIES: "PUBLISH", DIRECTORY: "PUBLISH",
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
      ["Contenido", ["Publicaciones", "Lugares", "Celebraciones", "Galerías", "Directorio", "Series", "En vivo", "Temas", "Imágenes"]],
      ["Publicidad", ["Espacios publicitarios", "Anunciantes"]],
      ["Equipo y ajustes", ["Trabajadores", "Configuración", "Registro de actividad", "Mi cuenta"]],
    ]);
  });
});

describe("qué puede crear cada persona (botón Crear, paleta y barra del celular)", () => {
  it("solo los tipos de contenido de sus módulos", () => {
    const items = createItems(user({ permissions: { CELEBRATIONS: "PUBLISH", PLACES: "PUBLISH" } }));
    expect(items.map((i) => i.label)).toEqual(["Lugar", "Celebración"]);
    expect(items.map((i) => i.href)).toEqual(["/admin/lugares/nuevo", "/admin/celebraciones/nuevo"]);
  });

  it("el dueño crea todo, en el orden del menú", () => {
    expect(createItems(user({ role: "OWNER" })).map((i) => i.label)).toEqual([
      "Publicación",
      "Lugar",
      "Celebración",
      "Galería",
      "Ficha de directorio",
      "Serie",
      "Transmisión en vivo",
    ]);
  });

  it("sin módulos de contenido no hay nada que crear", () => {
    expect(createItems(user({ permissions: { ADVERTISING: "ACCESS" } }))).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import type { AdminUser } from "@/lib/api/admin-types";
import { canAccess, hasAnyContentModule, isOwner } from "./permissions";

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

describe("permisos del panel (espejo de Permissions.java)", () => {
  it("el dueño puede todo", () => {
    const owner = user({ role: "OWNER" });
    expect(isOwner(owner)).toBe(true);
    expect(canAccess(owner, "ADVERTISING")).toBe(true);
    expect(canAccess(owner, "CELEBRATIONS")).toBe(true);
  });

  it("un módulo de contenido es publicar en él", () => {
    expect(canAccess(user({ permissions: { CELEBRATIONS: "PUBLISH" } }), "CELEBRATIONS")).toBe(true);
    expect(canAccess(user({ permissions: { CELEBRATIONS: "PUBLISH" } }), "PLACES")).toBe(false);
  });

  it("sin permiso no hay acceso; ACCESS abre módulos que no son de contenido", () => {
    expect(canAccess(user(), "CELEBRATIONS")).toBe(false);
    expect(canAccess(user({ permissions: { CATEGORIES: "ACCESS" } }), "CATEGORIES")).toBe(true);
  });

  it("imágenes ajenas: algún módulo de contenido", () => {
    expect(hasAnyContentModule(user({ permissions: { PLACES: "PUBLISH" } }))).toBe(true);
    expect(hasAnyContentModule(user({ permissions: { STATS: "ACCESS" } }))).toBe(false);
  });
});

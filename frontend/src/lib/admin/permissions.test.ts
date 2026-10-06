import { describe, expect, it } from "vitest";
import type { AdminUser } from "@/lib/api/admin-types";
import { canAccess, canPublish, canPublishAnyContent, isOwner } from "./permissions";

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
    expect(canPublish(owner, "EVENTS")).toBe(true);
  });

  it("PUBLISH implica acceso; CREATE da acceso pero no publica", () => {
    expect(canAccess(user({ permissions: { EVENTS: "PUBLISH" } }), "EVENTS")).toBe(true);
    expect(canPublish(user({ permissions: { EVENTS: "PUBLISH" } }), "EVENTS")).toBe(true);
    expect(canAccess(user({ permissions: { EVENTS: "CREATE" } }), "EVENTS")).toBe(true);
    expect(canPublish(user({ permissions: { EVENTS: "CREATE" } }), "EVENTS")).toBe(false);
  });

  it("sin permiso no hay acceso; ACCESS abre módulos que no son de contenido", () => {
    expect(canAccess(user(), "EVENTS")).toBe(false);
    expect(canAccess(user({ permissions: { CATEGORIES: "ACCESS" } }), "CATEGORIES")).toBe(true);
  });

  it("imágenes ajenas: publicar en algún módulo de contenido", () => {
    expect(canPublishAnyContent(user({ permissions: { PLACES: "PUBLISH" } }))).toBe(true);
    expect(canPublishAnyContent(user({ permissions: { PLACES: "CREATE", STATS: "ACCESS" } }))).toBe(false);
  });
});

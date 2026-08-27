import { describe, expect, it } from "vitest";
import { ADMIN_NAV_ITEMS, visibleNavItems } from "./nav";
import type { Role } from "@/lib/api/admin-types";

const ALL_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR", "MODERATOR", "COLLABORATOR", "USER"];

describe("visibleNavItems", () => {
  it("un ítem sin `roles` es visible para cualquier rol", () => {
    const unrestricted = ADMIN_NAV_ITEMS.filter((item) => !item.roles);
    expect(unrestricted.length).toBeGreaterThan(0);
    for (const role of ALL_ROLES) {
      const visibleHrefs = visibleNavItems(role).map((i) => i.href);
      for (const item of unrestricted) {
        expect(visibleHrefs).toContain(item.href);
      }
    }
  });

  it("USER (sin permisos admin) no ve ningún ítem restringido por rol", () => {
    const restricted = ADMIN_NAV_ITEMS.filter((item) => item.roles);
    const visible = visibleNavItems("USER");
    for (const item of restricted) {
      expect(visible).not.toContainEqual(item);
    }
  });

  it("SUPER_ADMIN ve todo lo que su rol tiene permitido explícitamente", () => {
    // No necesariamente TODOS los ítems (section 43: nav ↔ SecurityConfig
    // deben coincidir a mano) — pero sí todo lo que declare SUPER_ADMIN.
    const visible = visibleNavItems("SUPER_ADMIN").map((i) => i.href);
    for (const item of ADMIN_NAV_ITEMS) {
      if (!item.roles || item.roles.includes("SUPER_ADMIN")) {
        expect(visible).toContain(item.href);
      } else {
        expect(visible).not.toContain(item.href);
      }
    }
  });

  it("solo muestra /admin/auditoria a SUPER_ADMIN y ADMIN (espeja SecurityConfig: /api/v1/admin/audit/**)", () => {
    for (const role of ALL_ROLES) {
      const visible = visibleNavItems(role).some((i) => i.href === "/admin/auditoria");
      expect(visible).toBe(role === "SUPER_ADMIN" || role === "ADMIN");
    }
  });
});

import { describe, expect, it } from "vitest";
import { accountLabel } from "./role-labels";
import { WORKER_TEMPLATES } from "./worker-templates";

const ADMIN_PERMISSIONS = WORKER_TEMPLATES.find((t) => t.id === "ADMINISTRADOR")!.permissions;

describe("accountLabel", () => {
  it("el dueño siempre es Dueño", () => {
    expect(accountLabel({ role: "OWNER", permissions: {} })).toBe("Dueño");
  });

  it("un trabajador con la plantilla Administrador se muestra como Administrador", () => {
    expect(accountLabel({ role: "WORKER", permissions: { ...ADMIN_PERMISSIONS } })).toBe("Administrador");
  });

  it("cualquier otro trabajador se muestra como Trabajador", () => {
    expect(accountLabel({ role: "WORKER", permissions: { PUBLICATIONS: "PUBLISH" } })).toBe("Trabajador");
    expect(accountLabel({ role: "WORKER", permissions: {} })).toBe("Trabajador");
  });
});

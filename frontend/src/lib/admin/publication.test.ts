import { describe, expect, it } from "vitest";
import { computePublicationPermissions, PUBLICATION_KINDS, type PublicationPermissions } from "./publication";
import type { PublicationStatus } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";

function user(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: "user-1",
    email: "persona@test.local",
    firstName: "Persona",
    lastName: "De prueba",
    role: "WORKER",
    mustChangePassword: false,
    permissions: { PUBLICATIONS: "PUBLISH" },
    ...overrides,
  };
}

const worker = user();
const outsider = user({ permissions: { STATS: "ACCESS" } });
const owner = user({ role: "OWNER", permissions: {} });

function perms(status: PublicationStatus, who: AdminUser = worker): PublicationPermissions {
  return computePublicationPermissions({ status }, who, "publications");
}

// Réplica de shared.publishing.PublishableContent: quien tiene el módulo
// publica directo, sin paso de aprobación (V54). Si se desincronizan, la UI
// ofrece botones que el backend rechaza.
describe("computePublicationPermissions", () => {
  it("un borrador se edita, publica y programa directo", () => {
    expect(perms("DRAFT")).toEqual({
      canEdit: true,
      canPublish: true,
      canSchedule: true,
      canReturnToDraft: false,
      canArchive: false,
    });
  });

  it("lo programado se publica ya, se reprograma o se le quita la programación", () => {
    expect(perms("SCHEDULED")).toEqual({
      canEdit: true,
      canPublish: true,
      canSchedule: true,
      canReturnToDraft: true,
      canArchive: false,
    });
  });

  it("lo publicado se edita y se archiva", () => {
    expect(perms("PUBLISHED")).toEqual({
      canEdit: true,
      canPublish: false,
      canSchedule: false,
      canReturnToDraft: false,
      canArchive: true,
    });
  });

  it("lo archivado ya no se toca", () => {
    expect(Object.values(perms("ARCHIVED")).every((allowed) => !allowed)).toBe(true);
  });

  it("sin el módulo no hay ningún botón", () => {
    expect(Object.values(perms("DRAFT", outsider)).every((allowed) => !allowed)).toBe(true);
  });

  it("el dueño publica en cualquier tipo", () => {
    expect(computePublicationPermissions({ status: "DRAFT" }, owner, "galleries").canPublish).toBe(true);
  });

  it("el permiso es por módulo: Publicaciones no da Eventos", () => {
    expect(computePublicationPermissions({ status: "DRAFT" }, worker, "celebrations").canPublish).toBe(false);
  });

  it("cada tipo conoce su ruta del panel y su módulo", () => {
    expect(PUBLICATION_KINDS.publications).toMatchObject({ adminPath: "/admin/publicaciones", module: "PUBLICATIONS" });
    expect(PUBLICATION_KINDS.galleries).toMatchObject({ adminPath: "/admin/galerias", module: "GALLERIES" });
  });
});

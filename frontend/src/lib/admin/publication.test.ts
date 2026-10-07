import { describe, expect, it } from "vitest";
import { computePublicationPermissions, PUBLICATION_KINDS, type PublicationPermissions } from "./publication";
import type { PublicationStatus } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";

const ME = "user-1";

function user(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: ME,
    email: "persona@test.local",
    firstName: "Persona",
    lastName: "De prueba",
    role: "WORKER",
    mustChangePassword: false,
    permissions: { ARTICLES: "CREATE" },
    ...overrides,
  };
}

const creator = user();
const publisher = user({ permissions: { ARTICLES: "PUBLISH" } });
const owner = user({ role: "OWNER", permissions: {} });

function perms(status: PublicationStatus, who: AdminUser, authorId = ME): PublicationPermissions {
  return computePublicationPermissions({ status, authorId }, who, "articles");
}

// Réplica de las reglas de shared.publishing.PublishableContent y de los
// servicios del backend (spec 2026-10-07 §1): si se desincronizan, la UI
// ofrece botones que el backend rechaza.
describe("computePublicationPermissions", () => {
  it("quien crea: edita y envía su borrador, nada más", () => {
    expect(perms("DRAFT", creator)).toEqual({
      canEdit: true,
      canSubmit: true,
      canPublish: false,
      canSchedule: false,
      canReturnToDraft: false,
      canArchive: false,
    });
  });

  it.each<PublicationStatus>(["IN_REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"])(
    "quien crea no edita ni envía en %s",
    (status) => {
      const p = perms(status, creator);
      expect(p.canEdit).toBe(false);
      expect(p.canSubmit).toBe(false);
    },
  );

  it("quien crea no toca lo de otra persona", () => {
    expect(perms("DRAFT", creator, "otra-persona").canEdit).toBe(false);
    expect(perms("DRAFT", creator, "otra-persona").canSubmit).toBe(false);
  });

  it.each<PublicationStatus>(["DRAFT", "IN_REVIEW", "SCHEDULED"])("quien publica publica y programa desde %s", (status) => {
    const p = perms(status, publisher, "otra-persona");
    expect(p.canPublish).toBe(true);
    expect(p.canSchedule).toBe(true);
  });

  it("quien publica no ve «Enviar para aprobar»: publica directo", () => {
    expect(perms("DRAFT", publisher).canSubmit).toBe(false);
  });

  it("devolver a borrador solo desde pendiente o programado", () => {
    expect(perms("IN_REVIEW", publisher).canReturnToDraft).toBe(true);
    expect(perms("SCHEDULED", publisher).canReturnToDraft).toBe(true);
    expect(perms("DRAFT", publisher).canReturnToDraft).toBe(false);
    expect(perms("PUBLISHED", publisher).canReturnToDraft).toBe(false);
  });

  it("archivar solo lo publicado", () => {
    expect(perms("PUBLISHED", publisher).canArchive).toBe(true);
    expect(perms("DRAFT", publisher).canArchive).toBe(false);
  });

  it("quien publica edita todo menos lo archivado, también lo ya publicado", () => {
    for (const status of ["DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED"] as PublicationStatus[]) {
      expect(perms(status, publisher, "otra-persona").canEdit).toBe(true);
    }
    expect(perms("ARCHIVED", publisher).canEdit).toBe(false);
  });

  it("el dueño de la cuenta publica en cualquier tipo", () => {
    expect(computePublicationPermissions({ status: "DRAFT", authorId: "x" }, owner, "directory").canPublish).toBe(true);
  });

  it("el permiso es por módulo: publicar Publicaciones no publica Eventos", () => {
    expect(computePublicationPermissions({ status: "DRAFT", authorId: ME }, publisher, "events").canPublish).toBe(false);
  });

  it("cada tipo conoce su ruta del panel y su módulo", () => {
    expect(PUBLICATION_KINDS.articles).toMatchObject({ adminPath: "/admin/publicaciones", module: "ARTICLES" });
    expect(PUBLICATION_KINDS.directory).toMatchObject({ adminPath: "/admin/directorio", module: "DIRECTORY" });
  });
});

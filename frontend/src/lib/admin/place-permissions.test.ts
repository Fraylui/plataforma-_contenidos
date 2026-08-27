import { describe, expect, it } from "vitest";
import { computePlacePermissions } from "./place-permissions";
import type { Place, PlaceStatus } from "@/lib/api/types";
import type { AdminUser, Role } from "@/lib/api/admin-types";

function makePlace(overrides: Partial<Place> = {}): Place {
  return {
    id: "place-1",
    slug: "lugar-de-prueba",
    name: "Lugar de prueba",
    excerpt: null,
    body: "Descripción",
    status: "DRAFT",
    authorId: "author-1",
    categoryId: "cat-1",
    geographyId: null,
    latitude: null,
    longitude: null,
    imageIds: [],
    seoTitle: null,
    metaDescription: null,
    canonicalUrl: null,
    ogImageUrl: null,
    youtubeVideoId: null,
    robots: "index,follow",
    rejectionReason: null,
    publishedAt: null,
    scheduledAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    relatedArticles: [],
    ...overrides,
  };
}

function makeUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: "author-1",
    email: "user@test.local",
    displayName: "Usuario de prueba",
    role: "AUTHOR",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
    lastLoginAt: null,
    mfaEnabled: false,
    ...overrides,
  };
}

// Mismas reglas que article-permissions.ts (comentario en place-permissions.ts:
// "mismo patrón... estado por estado idéntico a Article") — mismo riesgo de
// desincronizarse con PlaceService (backend) si alguien cambia una regla acá
// sin tocar la otra.
describe("computePlacePermissions", () => {
  it("AUTHOR dueño puede editar/enviar en DRAFT y REJECTED, nadie más lo permite", () => {
    for (const status of ["DRAFT", "REJECTED"] as PlaceStatus[]) {
      const permissions = computePlacePermissions(makePlace({ status }), makeUser());
      expect(permissions.canEdit).toBe(true);
      expect(permissions.canSubmit).toBe(true);
    }
  });

  it("AUTHOR no dueño no puede editar ni en DRAFT", () => {
    const place = makePlace({ status: "DRAFT", authorId: "otro-author" });
    const permissions = computePlacePermissions(place, makeUser({ id: "author-1" }));
    expect(permissions.canEdit).toBe(false);
    expect(permissions.canSubmit).toBe(false);
  });

  describe.each<Role>(["EDITOR", "ADMIN", "SUPER_ADMIN"])("%s (EDITOR o superior)", (role) => {
    it("edita cualquier lugar en estado editable sin ser el dueño", () => {
      const place = makePlace({ status: "APPROVED", authorId: "otro-author" });
      const permissions = computePlacePermissions(place, makeUser({ role, id: "reviewer-1" }));
      expect(permissions.canEdit).toBe(true);
    });

    it("aprueba/rechaza solo en IN_REVIEW, publica/programa solo en APPROVED, archiva solo en PUBLISHED", () => {
      const inReview = computePlacePermissions(makePlace({ status: "IN_REVIEW" }), makeUser({ role }));
      expect(inReview.canApprove).toBe(true);
      expect(inReview.canReject).toBe(true);
      expect(inReview.canPublish).toBe(false);

      const approved = computePlacePermissions(makePlace({ status: "APPROVED" }), makeUser({ role }));
      expect(approved.canPublish).toBe(true);
      expect(approved.canSchedule).toBe(true);
      expect(approved.canArchive).toBe(false);

      const published = computePlacePermissions(makePlace({ status: "PUBLISHED" }), makeUser({ role }));
      expect(published.canArchive).toBe(true);
      expect(published.canEdit).toBe(false);
    });
  });
});

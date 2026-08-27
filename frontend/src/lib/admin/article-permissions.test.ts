import { describe, expect, it } from "vitest";
import { computeArticlePermissions } from "./article-permissions";
import type { Article, ArticleStatus } from "@/lib/api/types";
import type { AdminUser, Role } from "@/lib/api/admin-types";

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: "article-1",
    slug: "articulo-de-prueba",
    title: "Artículo de prueba",
    excerpt: null,
    body: "Cuerpo",
    articleType: "ARTICULO",
    status: "DRAFT",
    authorId: "author-1",
    categoryId: "cat-1",
    geographyId: null,
    tagIds: [],
    seoTitle: null,
    metaDescription: null,
    canonicalUrl: null,
    ogImageUrl: null,
    featuredImageId: null,
    youtubeVideoId: null,
    robots: "index,follow",
    rejectionReason: null,
    publishedAt: null,
    scheduledAt: null,
    createdAt: "2026-01-01T00:00:00Z",
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

// Réplica en TS de la matriz de ArticleServiceTest (backend): si estos dos
// se desincronizan, la UI ofrece botones que el backend rechaza (o peor,
// los esconde cuando sí deberían estar disponibles).
describe("computeArticlePermissions", () => {
  describe("AUTHOR dueño de su propio artículo", () => {
    it.each<ArticleStatus>(["DRAFT", "REJECTED"])("puede editar y enviar en estado %s", (status) => {
      const permissions = computeArticlePermissions(makeArticle({ status }), makeUser());
      expect(permissions.canEdit).toBe(true);
      expect(permissions.canSubmit).toBe(true);
    });

    it.each<ArticleStatus>(["IN_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "ARCHIVED"])(
      "no puede editar ni enviar en estado %s",
      (status) => {
        const permissions = computeArticlePermissions(makeArticle({ status }), makeUser());
        expect(permissions.canEdit).toBe(false);
        expect(permissions.canSubmit).toBe(false);
      },
    );

    it("nunca puede aprobar, rechazar, publicar, programar ni archivar", () => {
      const permissions = computeArticlePermissions(makeArticle({ status: "IN_REVIEW" }), makeUser());
      expect(permissions.canApprove).toBe(false);
      expect(permissions.canReject).toBe(false);
      expect(permissions.canPublish).toBe(false);
      expect(permissions.canSchedule).toBe(false);
      expect(permissions.canArchive).toBe(false);
    });
  });

  describe("AUTHOR sobre el artículo de otro", () => {
    it("no puede editar ni enviar aunque esté en DRAFT", () => {
      const article = makeArticle({ status: "DRAFT", authorId: "otro-author" });
      const permissions = computeArticlePermissions(article, makeUser({ id: "author-1" }));
      expect(permissions.canEdit).toBe(false);
      expect(permissions.canSubmit).toBe(false);
    });
  });

  describe.each<Role>(["EDITOR", "ADMIN", "SUPER_ADMIN"])("%s (EDITOR o superior)", (role) => {
    it("puede editar en cualquier estado editable, sea o no el dueño", () => {
      const article = makeArticle({ status: "IN_REVIEW", authorId: "otro-author" });
      const permissions = computeArticlePermissions(article, makeUser({ role, id: "reviewer-1" }));
      expect(permissions.canEdit).toBe(true);
    });

    it("no puede editar un artículo PUBLISHED ni ARCHIVED", () => {
      for (const status of ["PUBLISHED", "ARCHIVED"] as const) {
        const permissions = computeArticlePermissions(makeArticle({ status }), makeUser({ role }));
        expect(permissions.canEdit).toBe(false);
      }
    });

    it("aprueba/rechaza solo en IN_REVIEW", () => {
      const inReview = computeArticlePermissions(makeArticle({ status: "IN_REVIEW" }), makeUser({ role }));
      expect(inReview.canApprove).toBe(true);
      expect(inReview.canReject).toBe(true);

      const draft = computeArticlePermissions(makeArticle({ status: "DRAFT" }), makeUser({ role }));
      expect(draft.canApprove).toBe(false);
      expect(draft.canReject).toBe(false);
    });

    it("publica/programa solo en APPROVED", () => {
      const approved = computeArticlePermissions(makeArticle({ status: "APPROVED" }), makeUser({ role }));
      expect(approved.canPublish).toBe(true);
      expect(approved.canSchedule).toBe(true);

      const inReview = computeArticlePermissions(makeArticle({ status: "IN_REVIEW" }), makeUser({ role }));
      expect(inReview.canPublish).toBe(false);
      expect(inReview.canSchedule).toBe(false);
    });

    it("archiva solo en PUBLISHED", () => {
      const published = computeArticlePermissions(makeArticle({ status: "PUBLISHED" }), makeUser({ role }));
      expect(published.canArchive).toBe(true);

      const approved = computeArticlePermissions(makeArticle({ status: "APPROVED" }), makeUser({ role }));
      expect(approved.canArchive).toBe(false);
    });

    it("no puede enviar a revisión (submit es solo del dueño, incluso para EDITOR+)", () => {
      const article = makeArticle({ status: "DRAFT", authorId: "otro-author" });
      const permissions = computeArticlePermissions(article, makeUser({ role, id: "reviewer-1" }));
      expect(permissions.canSubmit).toBe(false);
    });
  });
});

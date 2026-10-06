import { describe, expect, it, vi } from "vitest";
import type { FeedItem } from "@/lib/api/types";

vi.mock("server-only", () => ({}));

const { fromFeedItem } = await import("./home-items");

function feedItem(overrides: Partial<FeedItem>): FeedItem {
  return {
    type: "ARTICLE",
    id: "11111111-1111-1111-1111-111111111111",
    slug: "hola",
    title: "Hola",
    excerpt: null,
    articleType: null,
    categoryId: "cat-1",
    coverImageId: null,
    coverImageUrl: null,
    hasVideo: false,
    publishedAt: "2026-10-01T12:00:00Z",
    likeCount: 3,
    images: [],
    startsAt: null,
    latitude: null,
    longitude: null,
    phone: null,
    website: null,
    ...overrides,
  };
}

describe("fromFeedItem", () => {
  it("convierte un negocio del directorio con carrusel (subida + enlace externo) y su contacto", () => {
    const item = fromFeedItem(
      feedItem({
        type: "BUSINESS",
        slug: "hostal-plaza",
        coverImageId: "img-1",
        images: [
          { imageId: "img-1", externalUrl: null },
          { imageId: null, externalUrl: "https://example.com/b.jpg" },
        ],
        phone: "+51 966 123 456",
        website: "https://hostal.example.com",
        latitude: -13.16,
        longitude: -74.22,
      }),
    );
    expect(item.kind).toBe("directorio");
    expect(item.href).toBe("/directorio/hostal-plaza");
    expect(item.images).toHaveLength(2);
    expect(item.images[0].isExternal).toBe(false);
    expect(item.images[0].url).toContain("/api/v1/images/img-1/file");
    expect(item.images[1]).toEqual({ url: "https://example.com/b.jpg", isExternal: true });
    expect(item.phone).toBe("+51 966 123 456");
    expect(item.website).toBe("https://hostal.example.com");
    expect(item.latitude).toBe(-13.16);
  });

  it("un evento conserva su fecha de inicio y ordena por ella", () => {
    const item = fromFeedItem(feedItem({ type: "EVENT", slug: "feria", startsAt: "2030-01-10T19:00:00Z" }));
    expect(item.kind).toBe("evento");
    expect(item.startsAt).toBe("2030-01-10T19:00:00Z");
    expect(item.sortDate).toBe("2030-01-10T19:00:00Z");
  });

  it("una galería del feed enlaza a /galerias", () => {
    expect(fromFeedItem(feedItem({ type: "GALLERY", slug: "fotos" })).href).toBe("/galerias/fotos");
  });
});

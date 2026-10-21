import { describe, expect, it, vi } from "vitest";
import type { FeedItem } from "@/lib/api/types";
import type { HomeItem } from "./home-items";

vi.mock("server-only", () => ({}));

const { fromFeedItem, splitUpNext } = await import("./home-items");

function feedItem(overrides: Partial<FeedItem>): FeedItem {
  return {
    type: "PUBLICATION",
    id: "11111111-1111-1111-1111-111111111111",
    slug: "hola",
    title: "Hola",
    excerpt: null,
    publicationType: null,
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
    seriesSlug: null,
    seriesTitle: null,
    youtubeVideoId: null,
    allDay: null,
    recursYearly: null,
    ...overrides,
  };
}

describe("fromFeedItem", () => {
  it("un episodio va a /series/{serie}/{episodio}, se presenta con el nombre de su serie y da me gusta por id", () => {
    const item = fromFeedItem(
      feedItem({
        type: "EPISODE",
        slug: "episodio-1-nazca",
        coverImageUrl: "https://i.ytimg.com/vi/aaaaaaaaaa1/hqdefault.jpg",
        images: [{ imageId: null, externalUrl: "https://i.ytimg.com/vi/aaaaaaaaaa1/hqdefault.jpg" }],
        hasVideo: true,
        seriesSlug: "curiosidades-del-mundo",
        seriesTitle: "Curiosidades del mundo",
        youtubeVideoId: "aaaaaaaaaa1",
      }),
    );
    expect(item.kind).toBe("episodio");
    expect(item.href).toBe("/series/curiosidades-del-mundo/episodio-1-nazca");
    expect(item.typeLabel).toBe("Curiosidades del mundo");
    expect(item.likeKey).toBe("11111111-1111-1111-1111-111111111111");
    expect(item.images[0]).toEqual({ url: "https://i.ytimg.com/vi/aaaaaaaaaa1/hqdefault.jpg", isExternal: true });
    expect(item.hasVideo).toBe(true);
  });


  it("un evento conserva su fecha de inicio y ordena por ella", () => {
    const item = fromFeedItem(feedItem({ type: "CELEBRATION", slug: "feria", startsAt: "2030-01-10T19:00:00Z" }));
    expect(item.kind).toBe("celebracion");
    expect(item.startsAt).toBe("2030-01-10T19:00:00Z");
    expect(item.sortDate).toBe("2030-01-10T19:00:00Z");
  });

  it("una galería del feed enlaza a /galerias", () => {
    expect(fromFeedItem(feedItem({ type: "GALLERY", slug: "fotos" })).href).toBe("/galerias/fotos");
  });
});

describe("fromSearchResult", () => {
  it("convierte un resultado de búsqueda en miniatura de cuadrícula (enlace, tipo y portada)", async () => {
    const { fromSearchResult } = await import("./home-items");
    const item = fromSearchResult({
      contentType: "CELEBRATION",
      id: "e1",
      slug: "feria",
      title: "Feria",
      excerpt: null,
      categoryId: null,
      featuredImageId: null,
      featuredImageUrl: "https://example.com/a.jpg",
      hasVideo: true,
      publishedAt: null,
      celebrationStartsAt: "2026-11-05T15:00:00Z",
      seriesSlug: null,
    });
    expect(item).toMatchObject({
      kind: "celebracion",
      href: "/celebraciones/feria",
      typeLabel: "Celebración",
      hasVideo: true,
      likeCount: 0,
      images: [{ url: "https://example.com/a.jpg", isExternal: true }],
    });
  });

  it("un episodio enlaza dentro de su serie y su «me gusta» va por id", async () => {
    const { fromSearchResult } = await import("./home-items");
    const item = fromSearchResult({
      contentType: "EPISODE",
      id: "ep1",
      slug: "episodio-1",
      title: "Episodio 1",
      excerpt: null,
      categoryId: "c1",
      featuredImageId: null,
      featuredImageUrl: "https://i.ytimg.com/vi/aaaaaaaaaa1/hqdefault.jpg",
      hasVideo: true,
      publishedAt: "2026-10-01T15:00:00Z",
      celebrationStartsAt: null,
      seriesSlug: "viajes",
    });
    expect(item).toMatchObject({ kind: "episodio", href: "/series/viajes/episodio-1", likeKey: "ep1", typeLabel: "Episodio" });
  });
});

describe("splitUpNext", () => {
  const items = ["a", "b", "c"].map((id) => ({ id }) as HomeItem);

  it("el primero es «Sigue» y el resto va a «Más como esto»", () => {
    const { upNext, more } = splitUpNext(items);
    expect(upNext?.id).toBe("a");
    expect(more.map((item) => item.id)).toEqual(["b", "c"]);
  });

  it("sin relacionados no hay «Sigue»", () => {
    expect(splitUpNext([])).toEqual({ upNext: null, more: [] });
  });
});

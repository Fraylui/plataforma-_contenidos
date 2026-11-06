import { describe, expect, it } from "vitest";
import { robotsWithLargePreview, shareImageUrl } from "./share-image";

const photo = { imageId: "img-1", externalUrl: null, title: null, caption: null };

describe("shareImageUrl", () => {
  it("prefiere la imagen elegida a mano", () => {
    expect(shareImageUrl({ ogImageUrl: "https://cdn.example/og.jpg", images: [photo] })).toBe("https://cdn.example/og.jpg");
  });

  it("sin imagen elegida usa la portada (antes salía sin foto)", () => {
    expect(shareImageUrl({ ogImageUrl: null, images: [photo] })).toMatch(/\/api\/v1\/images\/img-1\/file$/);
  });

  it("sin fotos usa la miniatura del primer video", () => {
    expect(shareImageUrl({ ogImageUrl: null, images: [], videos: [{ videoId: "abc123", title: null, caption: null, vertical: false }] })).toBe(
      "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
    );
  });

  it("sin nada devuelve null (queda la imagen del sitio)", () => {
    expect(shareImageUrl({ ogImageUrl: null, images: [] })).toBeNull();
  });
});

describe("robotsWithLargePreview", () => {
  it("agrega la vista grande a lo indexable", () => {
    expect(robotsWithLargePreview("index,follow")).toBe("index,follow, max-image-preview:large");
  });

  it("no toca lo que no se indexa", () => {
    expect(robotsWithLargePreview("noindex,nofollow")).toBe("noindex,nofollow");
  });
});

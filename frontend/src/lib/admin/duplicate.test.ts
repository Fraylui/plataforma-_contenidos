import { describe, expect, it } from "vitest";
import type { Publication } from "@/lib/api/types";
import { copyTitle, publicationCopy } from "./duplicate";

describe("Duplicar", () => {
  it("la copia lleva «Copia de …» sin pasarse de 200 letras", () => {
    expect(copyTitle("Lima en 3 días")).toBe("Copia de Lima en 3 días");
    expect(copyTitle("x".repeat(200))).toHaveLength(200);
  });

  it("copia texto, fotos, videos y tema, pero no lo que apunta al original", () => {
    const original = {
      id: "p1", slug: "lima-en-3-dias", title: "Lima en 3 días", excerpt: "Resumen", body: "<p>Texto</p>",
      publicationType: "GUIA", categoryId: "c1", status: "PUBLISHED",
      seoTitle: "Lima SEO", metaDescription: "Descripción", canonicalUrl: "https://sitio.pe/publicaciones/lima-en-3-dias",
      ogImageUrl: "https://sitio.pe/og.jpg", robots: "index,follow",
      images: [{ imageId: "i1", externalUrl: null, title: null, caption: null }],
      videos: [{ videoId: "abcdefghijk", title: "Recorrido", caption: null, vertical: true }],
    } as unknown as Publication;

    const copy = publicationCopy(original);

    expect(copy).toMatchObject({
      title: "Copia de Lima en 3 días", body: "<p>Texto</p>", publicationType: "GUIA", categoryId: "c1",
      excerpt: "Resumen", images: original.images, canonicalUrl: null, ogImageUrl: null, seoTitle: null,
    });
    expect(copy.videos).toEqual([{ url: "https://www.youtube.com/shorts/abcdefghijk", title: "Recorrido", caption: null }]);
    expect(copy).not.toHaveProperty("status");
  });
});

import { describe, expect, it } from "vitest";
import { choosePaths, countPaths } from "./choose-path";
import type { FeedItem, FeedItemType } from "@/lib/api/types";

function item(id: string, type: FeedItemType, categoryId: string | null): FeedItem {
  return {
    type,
    id,
    slug: id,
    title: id,
    excerpt: null,
    articleType: null,
    categoryId,
    coverImageId: null,
    coverImageUrl: null,
    hasVideo: false,
    publishedAt: null,
    likeCount: 0,
  };
}

const base = { currentId: "current", currentType: "ARTICLE" as FeedItemType, categoryId: "cultura" };

describe("choosePaths", () => {
  it("elige tres puertas distintas con intención distinta", () => {
    const related = [item("a1", "ARTICLE", "cultura"), item("p1", "PLACE", "cultura")];
    const pool = [item("x1", "ARTICLE", "turismo"), item("a1", "ARTICLE", "cultura")];

    const paths = choosePaths({ ...base, related, pool });

    expect(paths.otherForm?.id).toBe("p1");
    expect(paths.deeper?.id).toBe("a1");
    expect(paths.surprise?.id).toBe("x1");
    expect(countPaths(paths)).toBe(3);
  });

  it("nunca repite contenido ni incluye el actual", () => {
    const related = [item("p1", "PLACE", "cultura")];
    const pool = [item("current", "ARTICLE", "turismo"), item("p1", "PLACE", "cultura")];

    const paths = choosePaths({ ...base, related, pool });

    expect(paths.otherForm?.id).toBe("p1");
    expect(paths.deeper).toBeNull();
    expect(paths.surprise).toBeNull();
    expect(countPaths(paths)).toBe(1);
  });

  it("'otro formato' busca en el feed si los relacionados son todos del mismo tipo", () => {
    const related = [item("a1", "ARTICLE", "cultura")];
    const pool = [item("e1", "EVENT", "cultura"), item("p9", "PLACE", "turismo")];

    const paths = choosePaths({ ...base, related, pool });

    expect(paths.otherForm?.id).toBe("e1");
    // Un lugar de otro tema no cuenta como "el mismo tema en otro formato".
    expect(paths.surprise?.id).toBe("p9");
  });

  it("sin categoría no hay 'más profundo' ni 'otro formato', pero sí sorpresa", () => {
    const paths = choosePaths({ ...base, categoryId: null, related: [], pool: [item("x1", "PLACE", "turismo")] });

    expect(paths.deeper).toBeNull();
    expect(paths.otherForm).toBeNull();
    expect(paths.surprise?.id).toBe("x1");
  });

  it("la sorpresa es estable para el mismo contenido (página cacheable)", () => {
    const pool = ["x1", "x2", "x3", "x4"].map((id) => item(id, "ARTICLE", "turismo"));
    const first = choosePaths({ ...base, related: [], pool });
    const second = choosePaths({ ...base, related: [], pool });

    expect(first.surprise?.id).toBe(second.surprise?.id);
  });
});

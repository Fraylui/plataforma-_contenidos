import { describe, expect, it } from "vitest";
import { PERU_REGIONS, regionFromSlug, regionSlug } from "./peru-regions";

describe("direcciones por región", () => {
  it("la región va en minúsculas con guiones y vuelve igual", () => {
    expect(regionSlug("LA_LIBERTAD")).toBe("la-libertad");
    expect(regionFromSlug("madre-de-dios")).toBe("MADRE_DE_DIOS");
    for (const r of PERU_REGIONS) expect(regionFromSlug(regionSlug(r.key))).toBe(r.key);
  });

  it("lo que no es una región del Perú no tiene página", () => {
    expect(regionFromSlug("atlantida")).toBeNull();
    expect(regionFromSlug("")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { celebrationPlace, COUNTRY_OPTIONS, countryName } from "./countries";

describe("países", () => {
  it("nombra en español lo que manda Cloudflare", () => {
    expect(countryName("PE")).toBe("Perú");
    expect(countryName("mx")).toBe("México");
  });

  it("dice dónde se celebra", () => {
    expect(celebrationPlace(null, null)).toBe("Todo el mundo");
    expect(celebrationPlace("PE", null)).toBe("Perú");
    expect(celebrationPlace("PE", "Ayacucho")).toBe("Ayacucho, Perú");
  });

  it("ofrece cada país una vez, en orden alfabético", () => {
    const ids = COUNTRY_OPTIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("PE");
    const labels = COUNTRY_OPTIONS.map((c) => c.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, "es")));
  });
});

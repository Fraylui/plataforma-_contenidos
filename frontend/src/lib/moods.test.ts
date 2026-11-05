import { describe, expect, it } from "vitest";
import { isMoodKey, moodFromSlug, MOODS } from "./moods";

describe("ánimos del feed", () => {
  it("cada ánimo tiene su dirección con verbo y vuelve a su reacción", () => {
    expect(moodFromSlug("reirme")?.key).toBe("FUNNY");
    expect(moodFromSlug("sorprenderme")?.label).toBe("Quiero sorprenderme");
    for (const m of MOODS) expect(moodFromSlug(m.slug)?.key).toBe(m.key);
  });

  it("solo acepta reacciones conocidas", () => {
    expect(isMoodKey("WOW")).toBe(true);
    expect(isMoodKey("ABURRIDO")).toBe(false);
    expect(moodFromSlug("aburrirme")).toBeNull();
  });
});

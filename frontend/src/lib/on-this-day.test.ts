import { describe, expect, it } from "vitest";
import { formatMemorableDate, onThisDayKicker, onThisDayTitle, todayInPlatformZone } from "./on-this-day";
import type { OnThisDayItem } from "@/lib/api/types";

function item(daysUntil: number, yearsAgo: number | null): OnThisDayItem {
  return {
    daysUntil,
    yearsAgo,
    occurrence: "2026-12-09",
    article: {
      id: "a",
      slug: "a",
      title: "A",
      excerpt: null,
      articleType: "HISTORIA",
      categoryId: "c",
      coverImageId: null,
      coverImageUrl: null,
      hasVideo: false,
      publishedAt: null,
      likeCount: 0,
      memorableDay: 9,
      memorableMonth: 12,
      memorableYear: null,
    },
  };
}

describe("on-this-day", () => {
  it("usa el día de Lima, no el UTC", () => {
    // 03:00 UTC del 10 de diciembre = 22:00 del 9 en Lima.
    expect(todayInPlatformZone(new Date("2026-12-10T03:00:00Z"))).toBe("2026-12-09");
  });

  it("formatea la fecha memorable con y sin año", () => {
    expect(formatMemorableDate(9, 12)).toBe("9 de diciembre");
    expect(formatMemorableDate(9, 12, 1824)).toBe("9 de diciembre de 1824");
  });

  it("arma la línea de cuándo y hace cuánto", () => {
    expect(onThisDayKicker(item(0, 202))).toBe("Hoy · hace 202 años");
    expect(onThisDayKicker(item(1, 1))).toBe("Mañana · hace 1 año");
    expect(onThisDayKicker(item(3, null))).toBe("En 3 días");
    expect(onThisDayKicker(item(0, 0))).toBe("Hoy");
  });

  it("solo dice 'Un día como hoy' si hay algo de hoy", () => {
    expect(onThisDayTitle([item(0, null), item(2, null)])).toBe("Un día como hoy");
    expect(onThisDayTitle([item(2, null)])).toBe("Se recuerda esta semana");
  });
});

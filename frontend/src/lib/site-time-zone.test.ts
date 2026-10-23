import { describe, expect, it } from "vitest";
import { siteDayBoundary } from "./site-time-zone";

describe("siteDayBoundary", () => {
  it("el día de Lima (UTC-5) empieza a las 05:00 UTC y termina a las 04:59:59.999 UTC del día siguiente", () => {
    expect(siteDayBoundary("2026-10-15", false, "America/Lima")).toBe("2026-10-15T05:00:00.000Z");
    expect(siteDayBoundary("2026-10-15", true, "America/Lima")).toBe("2026-10-16T04:59:59.999Z");
  });

  it("respeta el horario de verano de otras zonas", () => {
    expect(siteDayBoundary("2026-07-01", false, "Europe/Madrid")).toBe("2026-06-30T22:00:00.000Z");
    expect(siteDayBoundary("2026-01-15", false, "Europe/Madrid")).toBe("2026-01-14T23:00:00.000Z");
  });
});

import { describe, expect, it } from "vitest";
import { ctr, fillDays, reportPeriods } from "./campaign-report";

const TODAY = new Date("2026-10-16T15:00:00Z");

describe("reporte de campaña", () => {
  it("rellena con cero los días sin datos (el eje es tiempo continuo)", () => {
    const days = fillDays([{ day: "2026-10-15", impressions: 5, clicks: 1, plays: 0 }], 3, TODAY);
    expect(days.map((d) => [d.day, d.impressions])).toEqual([
      ["2026-10-14", 0],
      ["2026-10-15", 5],
      ["2026-10-16", 0],
    ]);
  });

  it("separa el período elegido del anterior del mismo largo, y suma cada uno", () => {
    const stats = [
      { day: "2026-10-09", impressions: 100, clicks: 2, plays: 1 }, // período anterior (7 días)
      { day: "2026-10-12", impressions: 200, clicks: 10, plays: 4 },
      { day: "2026-10-16", impressions: 100, clicks: 5, plays: 0 },
    ];
    const { days, current, previous } = reportPeriods(stats, 7, TODAY);
    expect(days).toHaveLength(7);
    expect(days[0].day).toBe("2026-10-10");
    expect(days[6].day).toBe("2026-10-16");
    expect(current).toEqual({ impressions: 300, clicks: 15, plays: 4 });
    expect(previous).toEqual({ impressions: 100, clicks: 2, plays: 1 });
  });

  it("el porcentaje de clics no divide por cero", () => {
    expect(ctr(0, 0)).toBe("—");
    expect(ctr(5, 100)).toBe("5.0%");
  });
});

import { describe, expect, it } from "vitest";
import { kpiChange, parseDashboardRange } from "./dashboard";

describe("parseDashboardRange", () => {
  it("acepta 7, 30 y 90; cualquier otra cosa vuelve a 30", () => {
    expect(parseDashboardRange("7")).toBe(7);
    expect(parseDashboardRange("90")).toBe(90);
    expect(parseDashboardRange(["7", "90"])).toBe(7);
    expect(parseDashboardRange("5")).toBe(30);
    expect(parseDashboardRange(undefined)).toBe(30);
    expect(parseDashboardRange("abc")).toBe(30);
  });
});

describe("kpiChange", () => {
  it("calcula el porcentaje frente al período anterior", () => {
    expect(kpiChange({ current: 150, previous: 100 })).toEqual({ kind: "percent", value: 50 });
    expect(kpiChange({ current: 50, previous: 100 })).toEqual({ kind: "percent", value: -50 });
  });

  it("sin datos antes no inventa un porcentaje", () => {
    expect(kpiChange({ current: 12, previous: 0 })).toEqual({ kind: "new" });
    expect(kpiChange({ current: 0, previous: 0 })).toEqual({ kind: "none" });
  });
});

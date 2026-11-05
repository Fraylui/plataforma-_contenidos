import { describe, expect, it } from "vitest";
import { currentMonth, entriesByDay, monthLabel, monthWeeks, parseCalendarMonth, shiftMonth, todayIn } from "./calendar";
import type { CalendarEntry } from "@/lib/api/admin-types";

describe("calendario del panel", () => {
  it("solo acepta meses AAAA-MM razonables de la URL", () => {
    expect(parseCalendarMonth("2026-11")).toBe("2026-11");
    expect(parseCalendarMonth(["2026-02", "x"])).toBe("2026-02");
    expect(parseCalendarMonth("2026-13")).toBeNull();
    expect(parseCalendarMonth("noviembre")).toBeNull();
    expect(parseCalendarMonth("1800-01")).toBeNull();
    expect(parseCalendarMonth(undefined)).toBeNull();
  });

  it("mes y día de hoy en la hora de Lima, no en UTC", () => {
    // 1 de diciembre 03:00 UTC = 30 de noviembre 22:00 en Lima.
    const now = new Date("2026-12-01T03:00:00Z");
    expect(currentMonth("America/Lima", now)).toBe("2026-11");
    expect(todayIn("America/Lima", now)).toBe("2026-11-30");
  });

  it("pasa de un año a otro al ir al mes anterior o siguiente", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-06", 0)).toBe("2026-06");
  });

  it("nombre del mes en español", () => {
    expect(monthLabel("2026-11")).toBe("noviembre de 2026");
  });

  it("semanas de lunes a domingo con huecos al inicio y al final", () => {
    // Noviembre de 2026 empieza en domingo y tiene 30 días.
    const weeks = monthWeeks("2026-11");
    expect(weeks[0]).toEqual([null, null, null, null, null, null, "2026-11-01"]);
    expect(weeks.at(-1)).toEqual(["2026-11-30", null, null, null, null, null, null]);
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
    expect(monthWeeks("2028-02").flat().filter(Boolean)).toHaveLength(29);
  });

  it("agrupa las entradas por día", () => {
    const entry = (id: string, date: string): CalendarEntry => ({
      kind: "SCHEDULED", type: "GALLERY", id, title: id, status: "SCHEDULED", date, time: "10:00",
    });
    const byDay = entriesByDay([entry("a", "2026-11-02"), entry("b", "2026-11-02"), entry("c", "2026-11-05")]);
    expect(byDay.get("2026-11-02")?.map((e) => e.id)).toEqual(["a", "b"]);
    expect(byDay.get("2026-11-05")).toHaveLength(1);
  });
});

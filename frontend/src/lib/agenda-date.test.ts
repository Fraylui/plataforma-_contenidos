import { describe, expect, it } from "vitest";
import { agendaDateParts, formatAgendaDate, siteDateString, siteMidnightIso } from "./agenda-date";

// Medianoche de Lima (UTC-5) = 05:00 UTC.
const JULY_28 = "2027-07-28T05:00:00Z";

describe("formatAgendaDate", () => {
  it("una fecha que se repite cada año: día y mes, sin año", () => {
    expect(formatAgendaDate({ at: JULY_28, allDay: true, recursYearly: true })).toBe("28 de julio");
  });

  it("con año de origen, dice desde cuándo", () => {
    expect(formatAgendaDate({ at: JULY_28, allDay: true, recursYearly: true, sinceYear: 1821 })).toBe(
      "28 de julio · desde 1821",
    );
  });

  it("única de todo el día: fecha con año, sin hora", () => {
    expect(formatAgendaDate({ at: "2026-08-12T05:00:00Z", allDay: true, recursYearly: false })).toMatch(/12 ago.*2026/);
    expect(formatAgendaDate({ at: "2026-08-12T05:00:00Z", allDay: true, recursYearly: false })).not.toMatch(/a\. m\./);
  });

  it("única con hora: fecha y hora absolutas", () => {
    expect(formatAgendaDate({ at: "2026-08-12T18:30:00Z", allDay: false, recursYearly: false })).toMatch(/1:30/);
  });
});

describe("zona del sitio para fechas de todo el día", () => {
  it("la medianoche del día es la de Lima, no la del navegador (las pruebas corren en UTC)", () => {
    expect(siteMidnightIso("2026-07-28")).toBe("2026-07-28T05:00:00.000Z");
  });

  it("y de vuelta da el mismo día", () => {
    expect(siteDateString("2026-07-28T05:00:00.000Z")).toBe("2026-07-28");
  });
});

describe("agendaDateParts", () => {
  it("día y mes corto para el cuadrito de la fecha (zona de Lima)", () => {
    expect(agendaDateParts(JULY_28)).toEqual({ day: "28", month: "jul" });
  });
});

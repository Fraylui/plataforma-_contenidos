import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatEventDateTime, formatShortDate } from "@/lib/content-labels";
import { DateTimeInput, formatDateTimeReading } from "./date-time-input";

describe("formatDateTimeReading", () => {
  it("fecha y hora local en formato absoluto", () => {
    const reading = formatDateTimeReading("2026-12-12T19:00", "datetime-local");
    expect(reading).toBe(formatEventDateTime("2026-12-12T19:00"));
    expect(reading).toMatch(/12 dic/);
  });

  it("solo fecha: no se corre un día por la zona horaria", () => {
    expect(formatDateTimeReading("2026-12-12", "date")).toBe(formatShortDate("2026-12-12T00:00"));
    expect(formatDateTimeReading("2026-12-12", "date")).toMatch(/12 dic/);
  });

  it("vacío o inválido: sin lectura", () => {
    expect(formatDateTimeReading("", "datetime-local")).toBeNull();
    expect(formatDateTimeReading("no-es-fecha", "date")).toBeNull();
  });
});

describe("DateTimeInput", () => {
  it("muestra la lectura absoluta del valor", () => {
    render(<DateTimeInput aria-label="Empieza" defaultValue="2026-12-12T19:00" />);
    expect(screen.getByLabelText("Empieza")).toHaveAttribute("type", "datetime-local");
    expect(screen.getByText(formatEventDateTime("2026-12-12T19:00"))).toBeInTheDocument();
  });
});

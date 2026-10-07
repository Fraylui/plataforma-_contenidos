import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DateTimeInput, formatDateTimeReading } from "./date-time-input";

describe("formatDateTimeReading", () => {
  it("fecha y hora local en formato absoluto", () => {
    const reading = formatDateTimeReading("2026-12-12T19:00", "datetime-local");
    expect(reading).toMatch(/sáb, 12 dic/);
    expect(reading).toMatch(/7:00\sp\.\s?m\./);
  });

  it("solo fecha: no se corre un día por la zona horaria", () => {
    expect(formatDateTimeReading("2026-12-12", "date")).toMatch(/sáb, 12 dic.* 2026/);
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
    expect(screen.getByText(/sáb, 12 dic/)).toBeInTheDocument();
  });
});

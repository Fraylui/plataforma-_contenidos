import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { PassportButtons } from "./passport-buttons";

describe("PassportButtons", () => {
  beforeEach(() => window.localStorage.clear());

  it("«Ya fui» estampa el sello de la región y guarda el lugar", () => {
    render(<PassportButtons slug="mirador" name="Mirador" href="/lugares/mirador" region="AYACUCHO" />);
    fireEvent.click(screen.getByRole("button", { name: "Ya fui" }));
    expect(screen.getByRole("button", { name: "Ya fui" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("¡Primer sello!")).toBeInTheDocument();
    expect(screen.getByText("1 de 25 regiones del Perú")).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem("pasaporte:v1")!).mirador.status).toBe("BEEN");
  });

  it("«Quiero ir» lo guarda en la lista sin sello", () => {
    render(<PassportButtons slug="mirador" name="Mirador" href="/lugares/mirador" region="AYACUCHO" />);
    fireEvent.click(screen.getByRole("button", { name: "Quiero ir" }));
    expect(screen.getByText(/Guardado en tu lista/)).toBeInTheDocument();
    expect(screen.queryByText("¡Primer sello!")).not.toBeInTheDocument();
  });
});

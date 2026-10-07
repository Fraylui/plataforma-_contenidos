import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { Card, CollapsibleCard } from "./card";

describe("Card", () => {
  it("título como encabezado y descripción", async () => {
    const { container } = render(<Card title="Ubicación" description="Dónde ocurre">contenido</Card>);
    expect(screen.getByRole("heading", { name: "Ubicación" })).toBeInTheDocument();
    expect(screen.getByText("Dónde ocurre")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("CollapsibleCard cerrada por defecto y alterna aria-expanded", async () => {
    render(<CollapsibleCard title="Avanzado">oculto</CollapsibleCard>);
    const toggle = screen.getByRole("button", { name: "Avanzado" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("oculto")).not.toBeInTheDocument();
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("oculto")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { FilterChips } from "./filter-chips";

describe("FilterChips", () => {
  const options = [
    { label: "Todo", href: "/buscar?q=cafe", active: false },
    { label: "Lugares", href: "/buscar?q=cafe&type=PLACE", active: true },
  ];

  it("son enlaces reales y el activo lleva aria-current", () => {
    render(<FilterChips label="Tipo de contenido" options={options} />);
    expect(screen.getByRole("navigation", { name: "Tipo de contenido" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lugares" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Todo" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Todo" })).toHaveAttribute("href", "/buscar?q=cafe");
  });

  it("no renderiza nada con una sola opción (no hay qué elegir)", () => {
    const { container } = render(<FilterChips label="Tipo" options={[options[0]]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("es accesible", async () => {
    const { container } = render(<FilterChips label="Tipo de contenido" options={options} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

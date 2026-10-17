import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("muestra el texto con el tono pedido", () => {
    render(<Badge tone="success">Publicado</Badge>);
    expect(screen.getByText("Publicado")).toHaveAttribute("data-tone", "success");
  });

  it("el punto es decorativo", () => {
    const { container } = render(<Badge tone="warning" dot>Programado</Badge>);
    expect(container.querySelector("[data-dot]")).toHaveAttribute("aria-hidden", "true");
  });
});

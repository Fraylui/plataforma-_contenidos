import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EngagementCell } from "./content-cells";

describe("cifras de cada contenido en las listas del panel", () => {
  it("muestra visitas, me gusta, reacciones y clics de afiliado", () => {
    render(<EngagementCell counts={{ views: 1200, likes: 34, reactions: 18, affiliateClicks: 7 }} />);
    expect(screen.getByTitle("1200 visitas")).toHaveTextContent("1.2");
    expect(screen.getByTitle("34 me gusta")).toHaveTextContent("34");
    expect(screen.getByTitle("18 reacciones")).toHaveTextContent("18");
    expect(screen.getByTitle("7 clics en enlaces de afiliado")).toHaveTextContent("7");
  });

  it("sin reacciones ni clics, solo visitas y me gusta (lo vacío no se muestra)", () => {
    render(<EngagementCell counts={{ views: 3, likes: 0 }} />);
    expect(screen.queryByTitle(/reacciones/)).toBeNull();
    expect(screen.queryByTitle(/afiliado/)).toBeNull();
  });
});

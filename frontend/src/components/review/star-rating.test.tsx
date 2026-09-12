import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { StarRating } from "./star-rating";

describe("StarRating (unitario de componente)", () => {
  it("expone la calificación a lectores de pantalla y pinta N estrellas llenas", () => {
    const { container } = render(<StarRating rating={3} />);
    expect(screen.getByRole("img", { name: "Calificación: 3 de 5 estrellas" })).toBeInTheDocument();
    const stars = container.querySelectorAll("svg");
    expect(stars).toHaveLength(5);
    const filled = [...stars].filter((s) => s.getAttribute("fill") === "currentColor");
    expect(filled).toHaveLength(3);
  });

  it("con 5 llena todas y con 0 ninguna", () => {
    const five = render(<StarRating rating={5} />).container.querySelectorAll('svg[fill="currentColor"]');
    expect(five).toHaveLength(5);
    const zero = render(<StarRating rating={0} />).container.querySelectorAll('svg[fill="currentColor"]');
    expect(zero).toHaveLength(0);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<StarRating rating={4} size="lg" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

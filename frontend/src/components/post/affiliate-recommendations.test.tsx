import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AffiliateRecommendations } from "./affiliate-recommendations";

describe("Recomendados (enlaces de afiliado)", () => {
  it("cada enlace dice que es de afiliado, pasa por /go y va marcado sponsored", () => {
    render(<AffiliateRecommendations links={[{ id: "abc", label: "Tour a Kuélap", store: "civitatis.com" }]} />);
    expect(screen.getByRole("heading", { name: "Recomendados" })).toBeInTheDocument();
    expect(screen.getByText(/recibimos una comisión sin costo extra/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Tour a Kuélap/ });
    expect(link).toHaveTextContent("Enlace de afiliado");
    expect(link).toHaveTextContent("civitatis.com");
    expect(link.getAttribute("href")).toMatch(/\/api\/v1\/affiliate-links\/abc\/go$/);
    expect(link).toHaveAttribute("rel", "sponsored nofollow noopener noreferrer");
  });

  it("sin enlaces no aparece", () => {
    const { container } = render(<AffiliateRecommendations links={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

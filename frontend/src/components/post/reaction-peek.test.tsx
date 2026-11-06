import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReactionPeek } from "./reaction-peek";

describe("ReactionPeek", () => {
  it("no muestra nada sin reacciones", () => {
    const { container } = render(<ReactionPeek href="/publicaciones/x" counts={{ LOVE: 0 }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("suma y lleva a las reacciones del post", () => {
    render(<ReactionPeek href="/publicaciones/x" counts={{ LOVE: 2, WOW: 1 }} />);
    const link = screen.getByRole("link", { name: /3 reacciones: Me encanta, Me sorprende/ });
    expect(link).toHaveAttribute("href", "/publicaciones/x#reacciones");
  });
});

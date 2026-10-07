import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StickyAnchorAd } from "./sticky-anchor-ad";

describe("StickyAnchorAd", () => {
  it("la franja de ancho completo deja pasar los clics; solo la tarjeta del anuncio los recibe", () => {
    render(
      <StickyAnchorAd width={320}>
        <span>Banner</span>
      </StickyAnchorAd>,
    );
    const card = screen.getByText("Banner").parentElement!;
    const strip = card.parentElement!;
    // Sin esto, en escritorio la franja tapaba el pie del riel (menú «Más»).
    expect(strip).toHaveClass("pointer-events-none");
    expect(card).toHaveClass("pointer-events-auto");
  });
});

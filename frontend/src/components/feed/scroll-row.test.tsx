import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScrollRow } from "./scroll-row";

function mockOverflow(el: HTMLElement, { scrollWidth, clientWidth, scrollLeft }: { scrollWidth: number; clientWidth: number; scrollLeft: number }) {
  Object.defineProperty(el, "scrollWidth", { configurable: true, value: scrollWidth });
  Object.defineProperty(el, "clientWidth", { configurable: true, value: clientWidth });
  Object.defineProperty(el, "scrollLeft", { configurable: true, writable: true, value: scrollLeft });
}

describe("ScrollRow", () => {
  it("sin barra visible: usa la clase no-scrollbar", () => {
    render(<ScrollRow label="Temas">contenido</ScrollRow>);
    expect(screen.getByTestId("scroll-row")).toHaveClass("no-scrollbar");
  });

  it("muestra «siguientes» solo si hay más a la derecha y «anteriores» tras avanzar", () => {
    render(<ScrollRow label="Temas">contenido</ScrollRow>);
    const row = screen.getByTestId("scroll-row");
    expect(screen.queryByRole("button", { name: "Ver más temas" })).not.toBeInTheDocument();

    row.scrollBy = vi.fn();
    mockOverflow(row, { scrollWidth: 1200, clientWidth: 600, scrollLeft: 0 });
    act(() => {
      fireEvent.scroll(row);
    });
    fireEvent.click(screen.getByRole("button", { name: "Ver más temas" }));
    expect(row.scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: expect.any(Number) }));
    expect(screen.queryByRole("button", { name: "Ver temas anteriores" })).not.toBeInTheDocument();

    mockOverflow(row, { scrollWidth: 1200, clientWidth: 600, scrollLeft: 600 });
    act(() => {
      fireEvent.scroll(row);
    });
    expect(screen.getByRole("button", { name: "Ver temas anteriores" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver más temas" })).not.toBeInTheDocument();
  });
});

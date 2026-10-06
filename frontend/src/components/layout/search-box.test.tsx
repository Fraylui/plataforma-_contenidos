import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchBox } from "./search-box";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("SearchBox — atajo de teclado", () => {
  it("Ctrl+K enfoca el buscador de escritorio", () => {
    render(<SearchBox variant="desktop" categoryNames={{}} />);
    fireEvent.keyDown(document.body, { key: "k", ctrlKey: true });
    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it('"/" enfoca el buscador, pero no si se está escribiendo en otro campo', () => {
    render(
      <>
        <input aria-label="otro campo" />
        <SearchBox variant="desktop" categoryNames={{}} />
      </>,
    );
    const other = screen.getByLabelText("otro campo");
    other.focus();
    fireEvent.keyDown(other, { key: "/" });
    expect(other).toHaveFocus();

    fireEvent.keyDown(document.body, { key: "/" });
    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("la variante móvil no registra el atajo", () => {
    render(<SearchBox variant="mobile" categoryNames={{}} />);
    fireEvent.keyDown(document.body, { key: "k", ctrlKey: true });
    expect(screen.getByRole("combobox")).not.toHaveFocus();
  });
});

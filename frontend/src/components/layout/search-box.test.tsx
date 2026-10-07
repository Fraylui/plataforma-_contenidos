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

describe("SearchBox — diseño moderno", () => {
  it("no tiene el desplegable «Buscar en»", () => {
    render(<SearchBox variant="desktop" categoryNames={{}} />);
    expect(screen.queryByLabelText("Buscar en")).not.toBeInTheDocument();
    expect(document.querySelector("select")).toBeNull();
  });

  it("«Borrar búsqueda» aparece con texto, lo limpia y devuelve el foco al campo", () => {
    render(<SearchBox variant="desktop" categoryNames={{}} />);
    const input = screen.getByRole("combobox");
    expect(screen.queryByRole("button", { name: "Borrar búsqueda" })).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: "cafe" } });
    fireEvent.click(screen.getByRole("button", { name: "Borrar búsqueda" }));
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });

  it("cada sugerencia indica su tipo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            items: [
              {
                contentType: "PLACE",
                id: "p1",
                slug: "mirador",
                title: "Mirador de Acuchimay",
                excerpt: null,
                categoryId: null,
                featuredImageId: null,
                featuredImageUrl: null,
                hasVideo: false,
                publishedAt: null,
                eventStartsAt: null,
              },
            ],
            totalElements: 1,
          }),
        ),
      ),
    );
    render(<SearchBox variant="desktop" categoryNames={{}} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "mirador" } });
    const option = await screen.findByRole("option", { name: /Mirador de Acuchimay/ });
    expect(option).toHaveTextContent("Lugar");
    vi.unstubAllGlobals();
  });
});

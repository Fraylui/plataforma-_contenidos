import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LazyMap } from "./lazy-map";

describe("LazyMap", () => {
  it("no carga nada de Google hasta que la persona toca «Ver mapa»", () => {
    const { container } = render(<LazyMap latitude={-13.16} longitude={-74.22} title="Mirador" />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("link", { name: "Cómo llegar" })).toHaveAttribute("href", expect.stringContaining("destination=-13.16,-74.22"));

    fireEvent.click(screen.getByRole("button", { name: "Ver mapa" }));
    expect(screen.getByTitle("Mapa de Mirador")).toHaveAttribute("src", expect.stringContaining("q=-13.16,-74.22"));
    expect(screen.getByRole("status")).toHaveTextContent("Cargando mapa");
  });
});

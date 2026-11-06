import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PhotoStack } from "./photo-stack";

vi.mock("server-only", () => ({}));

describe("PhotoStack (galería en vertical, como Instagram)", () => {
  it("una foto debajo de otra, con su título y pie, y numeradas para quien usa lector", () => {
    render(
      <PhotoStack
        alt="Semana Santa"
        images={[
          { imageId: "a", externalUrl: null, title: "Domingo de Ramos", caption: "Alfombras de flores en la Plaza de Armas." },
          { imageId: null, externalUrl: "https://ejemplo.test/b.jpg", title: null, caption: null },
        ]}
      />,
    );
    const figures = screen.getAllByRole("figure");
    expect(figures).toHaveLength(2);
    expect(screen.getByText("Domingo de Ramos")).toBeInTheDocument();
    expect(screen.getByText("Alfombras de flores en la Plaza de Armas.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Domingo de Ramos" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Semana Santa, foto 3 de 3" })).toBeInTheDocument();
  });

  it("sin fotos no pinta nada", () => {
    const { container } = render(<PhotoStack alt="x" images={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

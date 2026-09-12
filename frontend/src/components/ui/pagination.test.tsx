import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { Pagination } from "./pagination";

const buildHref = (page: number) => `/publicaciones?page=${page}`;

describe("Pagination (unitario de componente)", () => {
  it("no renderiza nada con una sola página", () => {
    const { container } = render(<Pagination page={0} totalPages={1} buildHref={buildHref} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("en la primera página solo ofrece Siguiente", () => {
    render(<Pagination page={0} totalPages={3} buildHref={buildHref} />);
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Anterior" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute("href", "/publicaciones?page=1");
  });

  it("en la última página solo ofrece Anterior", () => {
    render(<Pagination page={2} totalPages={3} buildHref={buildHref} />);
    expect(screen.getByText("Página 3 de 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Anterior" })).toHaveAttribute("href", "/publicaciones?page=1");
    expect(screen.queryByRole("link", { name: "Siguiente" })).not.toBeInTheDocument();
  });

  it("en una página intermedia ofrece ambos enlaces y es accesible", async () => {
    const { container } = render(<Pagination page={1} totalPages={3} buildHref={buildHref} />);
    expect(screen.getByRole("link", { name: "Anterior" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Siguiente" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

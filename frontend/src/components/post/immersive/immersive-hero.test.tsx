import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ImmersiveHero } from "./immersive-hero";

const header = { brand: { name: "Ecos del Camino", logoUrl: null }, typeLabel: "Publicación", categoryName: "Gastronomía", time: null };

describe("ImmersiveHero", () => {
  it("sin portada muestra el título como h1 sobre el fondo de acento, sin imagen", () => {
    const { container } = render(<ImmersiveHero coverUrl={null} title="Mercado de Huamanga" header={header} />);
    expect(screen.getByRole("heading", { level: 1, name: "Mercado de Huamanga" })).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Ecos del Camino")).toBeInTheDocument();
  });

  it("con portada la carga primero (LCP) y el título va encima", () => {
    const { container } = render(<ImmersiveHero coverUrl="/api/v1/images/1/file" title="Mercado" header={header} />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("src", "/api/v1/images/1/file");
    expect(img).toHaveAttribute("fetchpriority", "high");
    expect(screen.getByRole("heading", { level: 1, name: "Mercado" })).toBeInTheDocument();
  });

  it("si la portada no carga queda el fondo de acento con el título, sin ícono roto", () => {
    const { container } = render(<ImmersiveHero coverUrl="https://ejemplo.test/rota.jpg" title="Mercado" header={header} />);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: "Mercado" })).toBeInTheDocument();
  });
});

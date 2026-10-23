import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ImmersiveHero } from "./immersive-hero";

vi.mock("server-only", () => ({}));

const header = { brand: { name: "Ecos del Camino", logoUrl: null }, typeLabel: "Publicación", categoryName: "Gastronomía", time: null };

describe("ImmersiveHero", () => {
  it("sin portada muestra el título como h1 sobre el fondo de acento, sin imagen", () => {
    const { container } = render(<ImmersiveHero cover={null} title="Mercado de Huamanga" header={header} />);
    expect(screen.getByRole("heading", { level: 1, name: "Mercado de Huamanga" })).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Ecos del Camino")).toBeInTheDocument();
  });

  it("una portada subida pasa por next/image (optimizada para la velocidad de carga)", () => {
    const { container } = render(<ImmersiveHero cover={{ kind: "uploaded", imageId: "abc" }} title="Mercado" header={header} />);
    expect(container.querySelector("img")?.getAttribute("src")).toContain("/_next/image");
    expect(screen.getByRole("heading", { level: 1, name: "Mercado" })).toBeInTheDocument();
  });

  it("un enlace externo que no carga no deja ícono roto y el título sigue", () => {
    const { container } = render(
      <ImmersiveHero cover={{ kind: "url", url: "https://ejemplo.test/rota.jpg" }} title="Mercado" header={header} />,
    );
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("fetchpriority", "high");
    fireEvent.error(img);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: "Mercado" })).toBeInTheDocument();
  });

  it("muestra el sello (p. ej. la fecha de una celebración) sobre la portada", () => {
    render(<ImmersiveHero cover={null} title="Fiestas Patrias" header={header} badge={<span>28 jul</span>} />);
    expect(screen.getByText("28 jul")).toBeInTheDocument();
  });
});

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AdminCategory } from "@/lib/api/admin-types";
import { TopicList } from "./topic-list";

const topic = (overrides: Partial<AdminCategory>): AdminCategory => ({
  id: overrides.slug ?? "x",
  name: "Tema",
  slug: "tema",
  description: null,
  parentId: null,
  active: true,
  sortOrder: 0,
  publishedCount: 0,
  visibleOnSite: false,
  ...overrides,
});

function row(name: string) {
  return within(screen.getByRole("link", { name }).closest("li")!);
}

describe("TopicList: cuánto tiene cada tema y si el visitante lo ve", () => {
  const topics = [
    topic({ slug: "viajes", name: "Viajes", publishedCount: 0, visibleOnSite: true }),
    topic({ slug: "playas", name: "Playas", parentId: "viajes", publishedCount: 1, visibleOnSite: true }),
    topic({ slug: "animales", name: "Animales", publishedCount: 12, visibleOnSite: true }),
    topic({ slug: "vacio", name: "Tema vacío" }),
    topic({ slug: "viejo", name: "Tema viejo", active: false, publishedCount: 3 }),
  ];

  it("cuenta el contenido publicado con singular y plural", () => {
    render(<TopicList topics={topics} toggleAction={vi.fn()} />);
    expect(row("Playas").getByText("1 publicado")).toBeInTheDocument();
    expect(row("Animales").getByText("12 publicados")).toBeInTheDocument();
    expect(row("Tema vacío").getByText("Sin contenido publicado")).toBeInTheDocument();
  });

  it("avisa cuando un tema activo no se ve en el sitio", () => {
    render(<TopicList topics={topics} toggleAction={vi.fn()} />);
    expect(row("Tema vacío").getByText("No se ve en el sitio")).toBeInTheDocument();
    expect(row("Animales").getByText("En el sitio")).toBeInTheDocument();
    // Un padre sin contenido propio se ve si un subtema lo tiene.
    expect(row("Viajes").getByText("En el sitio")).toBeInTheDocument();
    expect(row("Tema viejo").getByText("Inactivo")).toBeInTheDocument();
  });

  it("pone los subtemas debajo de su padre", () => {
    render(<TopicList topics={topics} toggleAction={vi.fn()} />);
    const names = screen.getAllByRole("link").map((link) => link.textContent);
    expect(names.indexOf("Playas")).toBe(names.indexOf("Viajes") + 1);
  });
});

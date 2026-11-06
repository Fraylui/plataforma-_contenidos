import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Category } from "@/lib/api/types";
import { SearchSuggestions } from "./search-suggestions";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/client", () => ({ getFeed: vi.fn().mockResolvedValue({ items: [], hasMore: false }) }));

const categories = [
  { id: "c1", name: "Turismo", slug: "turismo" },
  { id: "c2", name: "Historia", slug: "historia" },
] as Category[];

describe("SearchSuggestions", () => {
  it("sin nada escrito, propone explorar por tema (en vez de una pantalla vacía)", async () => {
    render(await SearchSuggestions({ query: "", categories, excludeIds: [], hasResults: false }));
    expect(screen.getByRole("heading", { name: "Explora por tema" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Turismo" })).toHaveAttribute("href", "/categorias/turismo");
    expect(screen.getByRole("link", { name: "Historia" })).toBeInTheDocument();
  });

  it("con una búsqueda, solo los temas parecidos", async () => {
    render(await SearchSuggestions({ query: "turistico", categories, excludeIds: [], hasResults: false }));
    expect(screen.getByRole("link", { name: "Turismo" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Historia" })).toBeNull();
  });
});

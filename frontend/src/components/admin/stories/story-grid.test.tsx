import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AdminStory } from "@/lib/api/admin-types";
import { StoryGrid, StoryTabs } from "./story-grid";

const now = new Date("2026-10-23T12:00:00Z");
const story = (id: string, extra: Partial<AdminStory> = {}): AdminStory => ({
  id, imageId: null, background: "OCEAN", caption: `Texto ${id}`, captionPosition: "CENTER", link: null, youtubeVideoId: null,
  publishedAt: "2026-10-23T07:00:00Z", expiresAt: "2026-10-23T17:00:00Z", highlighted: false, likeCount: 4,
  categoryId: "c1", categoryName: "Gastronomía", views: 120, ctaClicks: 9, linkContentType: null, linkContentId: null, ...extra,
});

describe("StoryTabs", () => {
  it("tres pestañas y marca la actual", () => {
    render(<StoryTabs current="HIGHLIGHTED" />);
    const nav = screen.getByRole("navigation", { name: "Historias" });
    expect(within(nav).getAllByRole("link").map((a) => a.textContent)).toEqual(["Activas", "Destacadas", "Terminadas (7 días)"]);
    expect(within(nav).getByRole("link", { name: "Destacadas" })).toHaveAttribute("aria-current", "page");
  });
});

describe("StoryGrid", () => {
  it("muestra tiempo, tema y métricas de cada historia", () => {
    render(<StoryGrid stories={[story("a")]} now={now} />);
    const card = screen.getByRole("article", { name: "Texto a" });
    expect(within(card).getByText("quedan 5 h")).toBeInTheDocument();
    expect(within(card).getByText("Gastronomía")).toBeInTheDocument();
    expect(within(card).getByText("120 vistas · 4 me gusta · 9 toques")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "Editar" })).toHaveAttribute("href", "/admin/historias/a");
  });

  it("una terminada dice hace cuánto", () => {
    render(<StoryGrid stories={[story("b", { expiresAt: "2026-10-21T12:00:00Z" })]} now={now} />);
    expect(screen.getByText("terminó hace 2 d")).toBeInTheDocument();
  });
});

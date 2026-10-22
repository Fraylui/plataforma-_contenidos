import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PlatformStats } from "@/lib/api/admin-types";
import { StatsDashboard } from "./stats-dashboard";

const byStatus = (published: number, draft: number, scheduled: number, archived = 0) => ({
  PUBLISHED: published,
  DRAFT: draft,
  SCHEDULED: scheduled,
  ARCHIVED: archived,
});

const stats: PlatformStats = {
  publicationsByStatus: byStatus(22, 1, 1, 17),
  publicationsPublishedLast30Days: 3,
  publishedTrendLast30Days: [],
  placesByStatus: byStatus(10, 2, 0),
  celebrationsByStatus: byStatus(8, 0, 1),
  galleriesByStatus: byStatus(6, 0, 0),
  totalCategories: 23,
  activeCategories: 23,
  usersByRole: { OWNER: 1, WORKER: 7 } as PlatformStats["usersByRole"],
  activeUsers: 8,
};

function figure(label: string) {
  return within(screen.getByText(label).closest("div")!);
}

describe("StatsDashboard: cifras que cuadran con el Inicio del panel", () => {
  it("«En el sitio» y «En preparación» suman todos los tipos; lo que es solo de Publicaciones lo dice", () => {
    render(<StatsDashboard stats={stats} />);
    expect(figure("En el sitio").getByText("46")).toBeInTheDocument();
    expect(figure("En preparación").getByText("5")).toBeInTheDocument();
    expect(figure("Publicaciones en 30 días").getByText("3")).toBeInTheDocument();
    expect(screen.queryByText("Publicados")).toBeNull();
  });
});

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EventSummary } from "@/lib/api/types";
import type { HomeItem } from "@/lib/home-items";
import { RightColumn } from "./right-column";

vi.mock("@/components/legal/ad-block", () => ({ AdBlock: () => null }));
vi.mock("@/lib/server-image-url", () => ({ serverImageUrl: (p: string) => p }));

const event: EventSummary = {
  id: "e1",
  slug: "concierto-de-jazz",
  title: "Concierto de Jazz en el Jardín Botánico",
  excerpt: null,
  categoryId: "c1",
  placeId: null,
  venueName: null,
  startsAt: "2026-10-18T23:00:00-05:00",
  endsAt: null,
  coverImageId: null,
  coverImageUrl: null,
  hasVideo: false,
  likeCount: 0,
};

function liked(n: number): HomeItem {
  return { id: `p${n}`, href: `/publicaciones/p${n}`, title: `Post ${n}`, likeCount: 10 - n } as HomeItem;
}

describe("RightColumn — estilo columna de Facebook", () => {
  it("evento como fila: miniatura con la fecha encima, título y lugar/tema", () => {
    render(<RightColumn events={[event]} topLiked={[]} categoryNames={{ c1: "Entretenimiento" }} />);
    const section = screen.getByRole("region", { name: "Próximos eventos" });
    expect(within(section).getByRole("link", { name: "Ver todo" })).toHaveAttribute("href", "/eventos");
    const row = within(section).getByRole("link", { name: /Concierto de Jazz/ });
    expect(row).toHaveAttribute("href", "/eventos/concierto-de-jazz");
    expect(row).toHaveTextContent("18");
    expect(row).toHaveTextContent("Entretenimiento");
  });

  it("lo más gustado sin líneas divisorias, con su cantidad real", () => {
    render(<RightColumn events={[]} topLiked={[liked(1), liked(2), liked(3)]} categoryNames={{}} />);
    const section = screen.getByRole("region", { name: "Lo más gustado" });
    expect(section.querySelector("[class*='divide-']")).toBeNull();
    expect(within(section).getByRole("link", { name: /Post 1/ })).toHaveTextContent("9 me gusta");
  });
});

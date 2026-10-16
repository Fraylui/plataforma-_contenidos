import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EventSummary } from "@/lib/api/types";
import type { HomeItem } from "@/lib/home-items";
import { RightColumn } from "./right-column";

vi.mock("@/components/legal/ad-block", () => ({ AdBlock: () => null }));
vi.mock("@/lib/server-image-url", () => ({ serverImageUrl: (p: string) => p }));

const event: EventSummary = {
  id: "e1",
  slug: "fiestas-patrias",
  title: "Fiestas Patrias",
  excerpt: null,
  categoryId: "c1",
  placeId: null,
  venueName: null,
  startsAt: "1821-07-28T00:00:00-05:00",
  endsAt: null,
  recursYearly: true,
  allDay: true,
  sinceYear: 1821,
  nextOccurrenceAt: "2027-07-28T00:00:00-05:00",
  coverImageId: null,
  coverImageUrl: null,
  hasVideo: false,
  likeCount: 0,
};

function liked(n: number): HomeItem {
  return { id: `p${n}`, href: `/publicaciones/p${n}`, title: `Post ${n}`, likeCount: 10 - n } as HomeItem;
}

describe("RightColumn — estilo columna de Facebook", () => {
  it("fecha como fila: miniatura con el día encima, título, cuándo vuelve y el tema", () => {
    render(<RightColumn events={[event]} topLiked={[]} categoryNames={{ c1: "Historia" }} />);
    const section = screen.getByRole("region", { name: "Próximas fechas" });
    expect(within(section).getByRole("link", { name: "Ver todo" })).toHaveAttribute("href", "/agenda");
    const row = within(section).getByRole("link", { name: /Fiestas Patrias/ });
    expect(row).toHaveAttribute("href", "/agenda/fiestas-patrias");
    expect(row).toHaveTextContent("28");
    expect(row).toHaveTextContent("28 de julio · desde 1821");
    expect(row).toHaveTextContent("Historia");
  });

  it("lo más gustado sin líneas divisorias, con su cantidad real", () => {
    render(<RightColumn events={[]} topLiked={[liked(1), liked(2), liked(3)]} categoryNames={{}} />);
    const section = screen.getByRole("region", { name: "Lo más gustado" });
    expect(section.querySelector("[class*='divide-']")).toBeNull();
    expect(within(section).getByRole("link", { name: /Post 1/ })).toHaveTextContent("9 me gusta");
  });
});

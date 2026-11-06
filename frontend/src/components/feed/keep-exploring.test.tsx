import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HomeItem } from "@/lib/home-items";
import { KeepExploring } from "./keep-exploring";

function tile(n: number): HomeItem {
  return {
    id: `t${n}`, kind: "lugar", slug: `l${n}`, likeKey: `l${n}`, href: `/lugares/l${n}`, likeCount: 0, title: `Lugar ${n}`,
    excerpt: null, imageUrl: null, imageIsExternal: false, categoryId: "c", typeLabel: "Lugar", sortDate: "", dateLabel: "", images: [],
  };
}

describe("KeepExploring (sin callejones sin salida)", () => {
  it("si una sección está vacía, ofrece seguir viendo contenido reciente en filas completas", () => {
    render(<KeepExploring items={[1, 2, 3, 4, 5, 6, 7].map(tile)} />);
    expect(screen.getByRole("heading", { name: "Mientras tanto, mira esto" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(6);
  });

  it("sin nada que ofrecer no pinta nada", () => {
    const { container } = render(<KeepExploring items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

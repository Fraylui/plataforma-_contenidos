import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HomeItem } from "@/lib/home-items";
import { ExploreGrid } from "./explore-grid";

function item(n: number, extra: Partial<HomeItem> = {}): HomeItem {
  return {
    id: `id-${n}`,
    kind: "lugar",
    slug: `lugar-${n}`,
    href: `/lugares/lugar-${n}`,
    likeCount: n,
    title: `Lugar ${n}`,
    excerpt: null,
    imageUrl: null,
    imageIsExternal: false,
    categoryId: "c1",
    typeLabel: "Lugar",
    sortDate: "2026-10-01T00:00:00Z",
    dateLabel: "",
    images: [],
    ...extra,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("ExploreGrid — cuadrícula de descubrimiento (Instagram)", () => {
  it("cuadrícula de 3 con enlace al detalle e ícono según carrusel, video o evento", () => {
    const items = [
      item(1, { images: [{ url: "/a.jpg", isExternal: false }, { url: "/b.jpg", isExternal: false }] }),
      item(2, { hasVideo: true }),
      item(3, { kind: "evento", href: "/eventos/e-3", typeLabel: "Evento" }),
    ];
    render(<ExploreGrid initialItems={items} initialHasMore={false} seed="s" />);
    const grid = screen.getByRole("list", { name: "Explorar" });
    expect(grid).toHaveClass("grid-cols-3");
    expect(screen.getByRole("link", { name: /Lugar 1/ })).toHaveAttribute("href", "/lugares/lugar-1");
    expect(screen.getByRole("img", { name: "Varias imágenes" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Video" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Evento" })).toBeInTheDocument();
  });

  it("al llegar al final pide más a /api/feed sin repetir lo visto", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [item(1), item(2)], hasMore: false }) });
    vi.stubGlobal("fetch", fetchMock);
    let trigger: (entries: { isIntersecting: boolean }[]) => void = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: typeof trigger) {
          trigger = cb;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    render(<ExploreGrid initialItems={[item(1)]} initialHasMore seed="s" />);
    trigger([{ isIntersecting: true }]);
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(2));
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/api/feed?");
    expect(url).toContain("exclude=id-1");
  });

  it("sin contenido muestra un mensaje", () => {
    render(<ExploreGrid initialItems={[]} initialHasMore={false} seed="s" />);
    expect(screen.getByText(/Todavía no hay nada para explorar/)).toBeInTheDocument();
  });

  it("es accesible", async () => {
    const { container } = render(<ExploreGrid initialItems={[item(1), item(2)]} initialHasMore={false} seed="s" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

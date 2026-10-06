import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HomeItem } from "@/lib/home-items";
import { TopicStories } from "./topic-stories";
import { exploreChipOptions, typeChipOptions } from "./type-chips";
import { Feed } from "./feed";

vi.mock("@/components/legal/ad-block-client", () => ({
  AdBlockClient: () => <div data-testid="ad" />,
}));

const brand = { name: "Ecos", logoUrl: null };

function post(n: number): HomeItem {
  return {
    id: `id-${n}`,
    kind: "lugar",
    slug: `lugar-${n}`,
    href: `/lugares/lugar-${n}`,
    likeCount: 0,
    title: `Lugar ${n}`,
    excerpt: null,
    imageUrl: null,
    imageIsExternal: false,
    categoryId: "c1",
    typeLabel: "Lugar",
    sortDate: "2026-10-01T00:00:00Z",
    dateLabel: "",
    images: [],
  };
}

describe("TopicStories", () => {
  const topics = [
    { categoryId: "t1", name: "Turismo", slug: "turismo", coverUrl: null, hasNew: true },
    { categoryId: "t2", name: "Cultura", slug: "cultura", coverUrl: null, hasNew: false },
  ];

  it("cada tema enlaza a su página; el que tiene novedades lleva anillo y lo anuncia", () => {
    render(<TopicStories topics={topics} />);
    const turismo = screen.getByRole("link", { name: /Turismo/ });
    expect(turismo).toHaveAttribute("href", "/categorias/turismo");
    expect(turismo).toHaveTextContent("nuevo");
    expect(screen.getByRole("link", { name: /Cultura/ })).not.toHaveTextContent("nuevo");
  });

  it("sin temas no se muestra", () => {
    const { container } = render(<TopicStories topics={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("es accesible", async () => {
    const { container } = render(<TopicStories topics={topics} activeCategoryId="t1" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("exploreChipOptions", () => {
  it("filtran la cuadrícula de Explorar (?tipo=) en vez de ir a la sección", () => {
    const options = exploreChipOptions({ "/lugares": true, "/eventos": false }, "PLACE");
    expect(options).toEqual([
      { label: "Todo", href: "/explorar", active: false },
      { label: "Lugares", href: "/explorar?tipo=PLACE", active: true },
    ]);
  });
});

describe("typeChipOptions", () => {
  it("solo tipos con contenido; el activo según la ruta", () => {
    const options = typeChipOptions({ "/lugares": true, "/eventos": false, "/publicaciones": true }, "/lugares");
    expect(options.map((o) => o.label)).toEqual(["Todo", "Publicaciones", "Lugares"]);
    expect(options.find((o) => o.label === "Lugares")?.active).toBe(true);
    expect(options.find((o) => o.label === "Todo")?.active).toBe(false);
  });
});

describe("Feed", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ items: [], hasMore: false }))));
  });

  it("una sola columna de posts con un anuncio cada 6, nunca antes del 6º", () => {
    const items = Array.from({ length: 13 }, (_, i) => post(i + 1));
    render(<Feed initialItems={items} initialHasMore={false} seed="s" filter={{}} brand={brand} categoryNames={{}} feedAd={null} />);
    expect(screen.getAllByRole("article")).toHaveLength(13);
    const ads = screen.getAllByTestId("ad");
    expect(ads).toHaveLength(2);
    const order = Array.from(document.querySelectorAll('article, [data-testid="ad"]')).map((e) => (e.tagName === "ARTICLE" ? "p" : "A"));
    expect(order.indexOf("A")).toBe(6);
  });

  it("sin contenido muestra un mensaje claro", () => {
    render(<Feed initialItems={[]} initialHasMore={false} seed="s" filter={{}} brand={brand} categoryNames={{}} feedAd={null} />);
    expect(screen.getByText("Todavía no hay publicaciones.")).toBeInTheDocument();
  });
});

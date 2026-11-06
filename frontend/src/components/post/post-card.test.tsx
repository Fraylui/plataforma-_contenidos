import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HomeItem } from "@/lib/home-items";
import { PostCard } from "./post-card";

const brand = { name: "Ecos del Camino", logoUrl: null };

function item(overrides: Partial<HomeItem>): HomeItem {
  return {
    id: "1",
    kind: "publicacion",
    slug: "hola",
    likeKey: "hola",
    href: "/publicaciones/hola",
    likeCount: 24,
    title: "Ruta del café",
    excerpt: "Un recorrido por las fincas de Villa Rica.",
    imageUrl: "https://example.com/a.jpg",
    imageIsExternal: true,
    categoryId: "c1",
    typeLabel: "Publicación",
    sortDate: new Date(Date.now() - 2 * 3600_000).toISOString(),
    dateLabel: "",
    images: [{ url: "https://example.com/a.jpg", isExternal: true }],
    ...overrides,
  };
}

describe("PostCard", () => {
  // El backend de reacciones: devuelve la reacción pedida como la propia.
  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    const mine = init?.body ? JSON.parse(init.body as string).reaction : null;
    const counts = { LOVE: 0, FUNNY: 0, WOW: 0, INSPIRED: 0, ...(mine ? { [mine]: 1 } : {}) };
    return new Response(JSON.stringify({ counts, mine }), { status: 200 });
  });

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockClear();
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("encabezado de post: marca · tipo · tema · tiempo relativo para publicaciones", () => {
    render(<PostCard item={item({})} brand={brand} categoryName="Turismo" />);
    const header = screen.getByTestId("post-header");
    expect(header).toHaveTextContent("Ecos del Camino");
    expect(header).toHaveTextContent("Publicación");
    expect(header).toHaveTextContent("Turismo");
    expect(header).toHaveTextContent("hace 2 h");
  });

  it("una celebración muestra su fecha absoluta y «Recordarme» (Google Calendar)", () => {
    render(<PostCard item={item({ kind: "celebracion", typeLabel: "Celebración", startsAt: "2030-01-10T19:00:00Z" })} brand={brand} />);
    expect(screen.getByTestId("post-header").textContent).not.toMatch(/hace /);
    expect(screen.getByRole("link", { name: /Recordarme/ })).toHaveAttribute("href", expect.stringContaining("calendar.google.com"));
  });

  it("un lugar con coordenadas ofrece Cómo llegar", () => {
    render(
      <PostCard item={item({ kind: "lugar", typeLabel: "Lugar", latitude: -13.16, longitude: -74.22 })} brand={brand} />,
    );
    expect(screen.getByRole("link", { name: /Cómo llegar/ })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=-13.16,-74.22",
    );
  });

  it("una fecha faltante o inválida no rompe la tarjeta (queda sin fecha)", () => {
    render(<PostCard item={item({ kind: "celebracion", typeLabel: "Celebración", startsAt: null, sortDate: "" })} brand={brand} />);
    expect(screen.getByTestId("post-header")).toHaveTextContent("Celebración");
    expect(screen.getByTestId("post-header").querySelector("time")).toBeNull();
  });

  it("en vez de un corazón, las reacciones: el botón abre las cuatro y elegir una la guarda", async () => {
    const user = userEvent.setup();
    render(<PostCard item={item({ likeCount: 0 })} brand={brand} />);
    expect(screen.queryByRole("button", { name: /^Me gusta/ })).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Reaccionar" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    const tray = screen.getByRole("group", { name: "Elige una reacción" });
    expect(within(tray).getAllByRole("button")).toHaveLength(4);
    await user.click(within(tray).getByRole("button", { name: "Me divierte" }));

    expect(screen.queryByRole("group", { name: "Elige una reacción" })).not.toBeInTheDocument();
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toMatchObject({ type: "PUBLICATION", id: "1", reaction: "FUNNY" });
    expect(localStorage.getItem("reaction:PUBLICATION:1")).toBe("FUNNY");
    expect(screen.getByRole("button", { name: /Me divierte: tu reacción/ })).toBeInTheDocument();
  });

  it("una sola fila: el total va en la píldora (los «me gusta» de antes cuentan como ❤️), sin línea «N reacciones»", () => {
    render(<PostCard item={item({ likeCount: 12 })} brand={brand} />);
    expect(screen.getByRole("button", { name: "12, Reaccionar" })).toHaveTextContent("12");
    expect(screen.queryByText(/reacciones/)).not.toBeInTheDocument();
  });

  it("quien ya dio «me gusta» antes ve su ❤️ Me encanta marcado", () => {
    localStorage.setItem("liked:publications:hola", "1");
    render(<PostCard item={item({ likeCount: 3 })} brand={brand} />);
    expect(screen.getByRole("button", { name: /Me encanta: tu reacción/ })).toBeInTheDocument();
  });

  it("los puntos del carrusel son fáciles de tocar (objetivo ≥ 24 px, WCAG 2.5.8)", () => {
    render(
      <PostCard
        item={item({ images: [{ url: "https://e.com/a.jpg", isExternal: true }, { url: "https://e.com/b.jpg", isExternal: true }] })}
        brand={brand}
      />,
    );
    for (const dot of screen.getAllByRole("button", { name: /Ir a la imagen/ })) {
      expect(dot).toHaveClass("h-6", "w-6");
    }
  });

  it("la foto del primer post se pide con prioridad alta (LCP), también si es un enlace externo", () => {
    const { container } = render(<PostCard item={item({ images: [{ url: "https://e.com/a.jpg", isExternal: true }] })} brand={brand} priority />);
    const img = container.querySelector("img[src='https://e.com/a.jpg']");
    expect(img).toHaveAttribute("fetchpriority", "high");
    expect(img).toHaveAttribute("loading", "eager");
  });

  it("publicaciones y galerías no tienen acción extra", () => {
    render(<PostCard item={item({})} brand={brand} />);
    expect(screen.queryByRole("link", { name: /Recordarme|Cómo llegar/ })).not.toBeInTheDocument();
  });

  it("sin imagen muestra un bloque de marca con el título, nunca un hueco", () => {
    render(<PostCard item={item({ images: [], imageUrl: null })} brand={brand} />);
    expect(screen.getByTestId("post-media-fallback")).toHaveTextContent("Ruta del café");
  });

  it("con 3 imágenes muestra 3 puntos del carrusel", () => {
    const images = ["a", "b", "c"].map((n) => ({ url: `https://example.com/${n}.jpg`, isExternal: true }));
    render(<PostCard item={item({ images })} brand={brand} />);
    expect(screen.getAllByRole("button", { name: /Ir a la imagen/ })).toHaveLength(3);
  });

  it("doble toque en la imagen pone ❤️ una sola vez (nunca lo quita)", async () => {
    vi.useFakeTimers();
    render(<PostCard item={item({})} brand={brand} />);
    const media = screen.getByTestId("post-media");
    await act(async () => {
      fireEvent.doubleClick(media);
    });
    await act(async () => {
      fireEvent.doubleClick(media);
    });
    vi.useRealTimers();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).toMatchObject({ reaction: "LOVE" });
  });

  it("no usa antetítulos en mayúsculas ni bajada larga, y es accesible", async () => {
    const { container } = render(<PostCard item={item({})} brand={brand} categoryName="Turismo" />);
    expect(container.querySelector(".uppercase")).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Ruta del café" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("una celebración lleva su sello de fecha sobre la foto, como en el detalle", () => {
    render(
      <PostCard
        item={item({ kind: "celebracion", typeLabel: "Celebración", href: "/celebraciones/feria", startsAt: "2027-07-28T05:00:00Z", recursYearly: true })}
        brand={brand}
      />,
    );
    expect(screen.getByTestId("celebration-stamp")).toHaveTextContent("28");
    expect(screen.getByTestId("celebration-stamp")).toHaveTextContent("jul");
  });

  it("una galería de 3 fotos o más se ve como mosaico con cuántas fotos tiene", () => {
    const images = ["a", "b", "c", "d", "e"].map((n) => ({ url: `https://example.com/${n}.jpg`, isExternal: true }));
    render(<PostCard item={item({ kind: "galeria", typeLabel: "Galería", href: "/galerias/fiesta", images })} brand={brand} />);
    const mosaic = screen.getByRole("link", { name: /Ver las 5 fotos/ });
    expect(mosaic).toHaveAttribute("href", "/galerias/fiesta");
    expect(mosaic.querySelectorAll("img")).toHaveLength(3);
    expect(mosaic).toHaveTextContent("+2");
  });
});

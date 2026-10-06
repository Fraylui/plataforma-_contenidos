import { act, fireEvent, render, screen } from "@testing-library/react";
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
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ liked: true, likeCount: 25 }), { status: 200 }));

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

  it("un evento muestra su fecha absoluta y la acción Agendar (Google Calendar)", () => {
    render(<PostCard item={item({ kind: "evento", typeLabel: "Evento", startsAt: "2030-01-10T19:00:00Z" })} brand={brand} />);
    expect(screen.getByTestId("post-header").textContent).not.toMatch(/hace /);
    expect(screen.getByRole("link", { name: /Agendar/ })).toHaveAttribute("href", expect.stringContaining("calendar.google.com"));
  });

  it("un lugar con coordenadas ofrece Cómo llegar; el directorio Llamar y Sitio web", () => {
    const { rerender } = render(
      <PostCard item={item({ kind: "lugar", typeLabel: "Lugar", latitude: -13.16, longitude: -74.22 })} brand={brand} />,
    );
    expect(screen.getByRole("link", { name: /Cómo llegar/ })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=-13.16,-74.22",
    );
    rerender(
      <PostCard
        item={item({ kind: "directorio", typeLabel: "Directorio", phone: "+51 966 123 456", website: "https://hostal.example.com" })}
        brand={brand}
      />,
    );
    expect(screen.getByRole("link", { name: /Llamar/ })).toHaveAttribute("href", "tel:+51966123456");
    expect(screen.getByRole("link", { name: /Sitio web/ })).toHaveAttribute("href", "https://hostal.example.com");
  });

  it("una fecha faltante o inválida no rompe la tarjeta (queda sin fecha)", () => {
    render(<PostCard item={item({ kind: "evento", typeLabel: "Evento", startsAt: null, sortDate: "" })} brand={brand} />);
    expect(screen.getByTestId("post-header")).toHaveTextContent("Evento");
    expect(screen.getByTestId("post-header").querySelector("time")).toBeNull();
  });

  it("publicaciones y galerías no tienen acción extra", () => {
    render(<PostCard item={item({})} brand={brand} />);
    expect(screen.queryByRole("link", { name: /Agendar|Cómo llegar|Llamar|Sitio web/ })).not.toBeInTheDocument();
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

  it("doble toque en la imagen da me gusta una sola vez (nunca lo quita)", async () => {
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
  });

  it("no usa antetítulos en mayúsculas ni bajada larga, y es accesible", async () => {
    const { container } = render(<PostCard item={item({})} brand={brand} categoryName="Turismo" />);
    expect(container.querySelector(".uppercase")).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Ruta del café" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

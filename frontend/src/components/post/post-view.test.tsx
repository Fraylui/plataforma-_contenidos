import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import type { HomeItem } from "@/lib/home-items";
import { PostView } from "./post-view";
import { GridTile } from "./grid-tile";

const brand = { name: "Ecos", logoUrl: null };

function tile(overrides: Partial<HomeItem>): HomeItem {
  return {
    id: "1",
    kind: "lugar",
    slug: "mirador",
    href: "/lugares/mirador",
    likeCount: 7,
    title: "Mirador",
    excerpt: null,
    imageUrl: "https://example.com/a.jpg",
    imageIsExternal: true,
    categoryId: "c1",
    typeLabel: "Lugar",
    sortDate: "2026-10-01T00:00:00Z",
    dateLabel: "",
    images: [{ url: "https://example.com/a.jpg", isExternal: true }],
    ...overrides,
  };
}

function view(variant: "visual" | "text") {
  return render(
    <PostView
      variant={variant}
      brand={brand}
      typeLabel="Lugar"
      categoryName="Turismo"
      time={{ label: "lun, 14 set. 2026", iso: "2026-09-14T00:00:00Z" }}
      title="Mirador de Acuchimay"
      media={<div data-testid="media" />}
      excerpt="Vista panorámica de la ciudad."
      body={<p>Cuerpo del post.</p>}
      facts={<p>Datos útiles</p>}
      actions={<button type="button">Me gusta</button>}
      more={[tile({ id: "2", slug: "otro", href: "/lugares/otro", title: "Otro lugar" })]}
    />,
  );
}

describe("PostView", () => {
  it("es un post: encabezado de marca, título h1, medio, texto y acciones; sin patrones de diario", () => {
    const { container } = view("visual");
    expect(screen.getByRole("heading", { level: 1, name: "Mirador de Acuchimay" })).toBeInTheDocument();
    expect(screen.getByTestId("post-header")).toHaveTextContent("Ecos · Lugar");
    expect(screen.getByTestId("media")).toBeInTheDocument();
    expect(screen.getByText("Datos útiles")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Acciones" })).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/min de lectura/);
    expect(screen.queryByRole("navigation", { name: "Breadcrumb" })).not.toBeInTheDocument();
    expect(container.querySelector(".uppercase")).toBeNull();
  });

  it("«Más como esto» muestra miniaturas enlazadas", () => {
    view("text");
    const section = screen.getByRole("region", { name: "Más como esto" });
    expect(section.querySelector('a[href="/lugares/otro"]')).not.toBeNull();
  });

  it("es accesible", async () => {
    const { container } = view("text");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("GridTile", () => {
  it("al pasar el mouse muestra los me gusta solo si hay (sin «♥ 0»)", () => {
    const { container, rerender } = render(<GridTile item={tile({ likeCount: 7 })} />);
    expect(container.querySelector("[data-testid='tile-likes']")).toHaveTextContent("7");
    rerender(<GridTile item={tile({ likeCount: 0 })} />);
    expect(container.querySelector("[data-testid='tile-likes']")).toBeNull();
  });

  it("marca carrusel, video y evento con ícono y muestra los me gusta", () => {
    const { rerender } = render(<GridTile item={tile({ images: [{ url: "a", isExternal: true }, { url: "b", isExternal: true }] })} />);
    expect(screen.getByLabelText("Varias imágenes")).toBeInTheDocument();
    rerender(<GridTile item={tile({ hasVideo: true })} />);
    expect(screen.getByLabelText("Video")).toBeInTheDocument();
    rerender(<GridTile item={tile({ kind: "evento", typeLabel: "Evento" })} />);
    expect(screen.getByLabelText("Evento")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAccessibleName(/Mirador/);
  });
});

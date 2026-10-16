import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRouter, useSearchParams } from "next/navigation";
import type { Gallery } from "@/lib/api/types";
import type { AdminContentPage, AdminUser } from "@/lib/api/admin-types";
import { GalleriesTable } from "./galleries-table";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: () => "/admin/galerias",
  useSearchParams: vi.fn(),
}));
vi.mock("@/app/admin/(protected)/publication-actions", () => ({ publicationStepAction: vi.fn() }));

function gallery(id: string, title: string, photos: number): Gallery {
  return {
    id, slug: id, title, excerpt: null, status: "PUBLISHED", authorId: "a", categoryId: "c",
    images: Array.from({ length: photos }, (_, i) => ({ imageId: `${id}-img-${i}`, externalUrl: null, title: null, caption: null })),
    seoTitle: null, metaDescription: null, canonicalUrl: null, ogImageUrl: null, robots: "index,follow",
    publishedAt: "2026-10-01T00:00:00Z", scheduledAt: null, createdAt: "2026-10-01T00:00:00Z", likeCount: 0,
  };
}

const PAGE: AdminContentPage<Gallery> = {
  items: [gallery("g1", "Atardeceres en Quinua", 12), gallery("g2", "Mercado de Huamanga", 1)],
  page: 0, size: 20, totalElements: 2, totalPages: 1,
  engagement: { g1: { views: 340, likes: 21 } },
};
const OWNER: AdminUser = {
  id: "u", email: "dueno@test", firstName: "D", lastName: "U", role: "OWNER", mustChangePassword: false, permissions: {},
};

const replace = vi.fn();

function withUrl(query: string) {
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(query) as never);
}

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({ push: vi.fn(), replace, refresh: vi.fn(), back: vi.fn() } as never);
  withUrl("");
});

describe("Galerías en el panel", () => {
  it("abren en cuadrícula: portada, cantidad de fotos, estado e interacción", async () => {
    const { container } = render(<GalleriesTable page={PAGE} currentUser={OWNER} />);
    const card = screen.getByRole("article", { name: "Atardeceres en Quinua" });
    expect(within(card).getByRole("link", { name: "Atardeceres en Quinua" })).toHaveAttribute("href", "/admin/galerias/g1");
    expect(card).toHaveTextContent("12 fotos");
    expect(card).toHaveTextContent("Publicado");
    expect(screen.getByRole("article", { name: "Mercado de Huamanga" })).toHaveTextContent("1 foto");
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByRole("button", { name: "Cuadrícula" })).toHaveAttribute("aria-pressed", "true");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("se puede pasar a lista, y la elección queda en la URL sin perder la página", async () => {
    withUrl("page=2");
    render(<GalleriesTable page={PAGE} currentUser={OWNER} />);
    await userEvent.click(screen.getByRole("button", { name: "Lista" }));
    expect(replace).toHaveBeenCalledWith("/admin/galerias?page=2&vista=lista", { scroll: false });
  });

  it("con ?vista=lista muestra la tabla de siempre", () => {
    withUrl("vista=lista");
    render(<GalleriesTable page={PAGE} currentUser={OWNER} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("article")).toBeNull();
  });

  it("en la cuadrícula también se seleccionan varias para las acciones en lote", async () => {
    render(<GalleriesTable page={PAGE} currentUser={OWNER} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Seleccionar Atardeceres en Quinua" }));
    expect(screen.getByRole("checkbox", { name: "Seleccionar Atardeceres en Quinua" })).toBeChecked();
    expect(screen.getByRole("article", { name: "Atardeceres en Quinua" })).toHaveClass("ring-accent");
    await userEvent.click(screen.getByRole("checkbox", { name: "Seleccionar todas las de esta página" }));
    expect(screen.getByRole("checkbox", { name: "Seleccionar Mercado de Huamanga" })).toBeChecked();
  });
});

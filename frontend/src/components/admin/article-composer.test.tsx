import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Article, Category } from "@/lib/api/types";
import type { PublicationPermissions } from "@/lib/admin/publication";
import { ArticleComposer } from "./article-composer";
import { AUTOSAVE_INTERVAL_MS } from "./use-autosave";
import { createArticleAction, updateArticleAction } from "@/app/admin/(protected)/publicaciones/actions";

vi.mock("@/app/admin/(protected)/publicaciones/actions", () => ({
  createArticleAction: vi.fn().mockResolvedValue({ ok: true, data: { id: "nuevo-1" } }),
  updateArticleAction: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock("@/app/admin/(protected)/imagenes/actions", () => ({ uploadImageInlineAction: vi.fn() }));
vi.mock("@/app/admin/(protected)/publication-actions", () => ({
  publicationStepAction: vi.fn().mockResolvedValue({ ok: true }),
}));
// El editor real (Tiptap) no escribe en jsdom; para el compositor basta un campo de texto.
vi.mock("./rich-text-editor", () => ({
  RichTextEditor: ({ value, onChange }: { value: string; onChange: (html: string) => void }) => (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

const CATEGORIES: Category[] = [{ id: "cat-1", name: "Viajes", slug: "viajes", parentId: null, active: true } as Category];
const PUBLISHER: PublicationPermissions = {
  canEdit: true,
  canSubmit: false,
  canPublish: true,
  canSchedule: true,
  canReturnToDraft: false,
  canArchive: false,
};

function renderNew() {
  return render(<ArticleComposer categories={CATEGORIES} allImages={[]} permissions={PUBLISHER} siteName="Ecos del Camino" />);
}

afterEach(() => vi.useRealTimers());

describe("ArticleComposer", () => {
  it("lenguaje de plataforma: título, descripción corta y texto; nada de extracto ni cuerpo", async () => {
    const { container } = renderNew();
    expect(screen.getByLabelText("Título")).toBeInTheDocument();
    expect(screen.getByLabelText("Descripción corta")).toBeInTheDocument();
    expect(screen.getByLabelText("Texto")).toBeInTheDocument();
    expect(screen.getByText("Fotos y videos")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Extracto|Cuerpo|SEO|Open Graph/);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("al guardar sin título avisa en el campo y lleva el foco ahí", async () => {
    renderNew();
    await userEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    const title = screen.getByLabelText("Título");
    expect(title).toHaveAccessibleDescription("Escribe un título.");
    expect(title).toHaveFocus();
    expect(createArticleAction).not.toHaveBeenCalled();
  });

  it("el guardado automático crea el borrador y cambia la URL sin salir de la página", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    const user = userEvent.setup();
    renderNew();
    await user.type(screen.getByLabelText("Título"), "Una ruta por el valle");
    await user.type(screen.getByLabelText("Texto"), "Tres días caminando.");
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_INTERVAL_MS));
    expect(createArticleAction).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe("/admin/publicaciones/nuevo-1");
    expect(screen.getByText(/^Guardado · /)).toBeInTheDocument();
  });

  it("lo ya publicado no se guarda solo: solo con «Guardar cambios»", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    const user = userEvent.setup();
    const article = {
      id: "pub-1",
      slug: "una-ruta",
      title: "Una ruta",
      excerpt: null,
      body: "<p>Texto</p>",
      articleType: "GENERAL",
      status: "PUBLISHED",
      authorId: "x",
      categoryId: "cat-1",
      seoTitle: null,
      metaDescription: null,
      canonicalUrl: null,
      ogImageUrl: null,
      images: [],
      videos: [],
      robots: "index,follow",
      reviewNote: null,
      publishedAt: "2026-10-01T10:00:00Z",
      scheduledAt: null,
      createdAt: "2026-10-01T10:00:00Z",
      updatedAt: "2026-10-01T10:00:00Z",
      likeCount: 0,
    } as Article;
    render(
      <ArticleComposer
        categories={CATEGORIES}
        allImages={[]}
        article={article}
        permissions={{ ...PUBLISHER, canPublish: false, canSchedule: false, canArchive: true }}
        siteName="Ecos del Camino"
      />,
    );
    await user.type(screen.getByLabelText("Título"), " nueva");
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_INTERVAL_MS * 3));
    expect(updateArticleAction).not.toHaveBeenCalled();
  });

  it("con cambios sin guardar, salir de la página pide confirmación", async () => {
    renderNew();
    await userEvent.type(screen.getByLabelText("Título"), "Algo");
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

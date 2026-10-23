import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { axe } from "vitest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActiveTopic, StoryView } from "@/lib/api/types";
import type { HomeItem } from "@/lib/home-items";
import { StoryViewer } from "./story-viewer";
import { isSeen } from "./seen-stories";

const inADay = () => new Date(Date.now() + 86_400_000).toISOString();

function story(id: string, extra: Partial<StoryView> = {}): StoryView {
  return {
    id, imageId: null, background: "SUNSET", caption: `Texto ${id}`, captionPosition: "CENTER", link: null,
    youtubeVideoId: null, publishedAt: new Date(Date.now() - 3 * 3_600_000).toISOString(), expiresAt: inADay(),
    highlighted: false, likeCount: 0, ...extra,
  };
}

const topics: ActiveTopic[] = [
  {
    category: { id: "t1", name: "Gastronomía", slug: "gastronomia" },
    latestAt: new Date().toISOString(),
    stories: [
      story("a", { link: { type: "PUBLICATION", slug: "diez-platos", title: "Diez platos", label: "Ver publicación" } }),
      story("b"),
      story("c", { youtubeVideoId: "abcdefghijk" }),
    ],
  },
  { category: { id: "t2", name: "Historia", slug: "historia" }, latestAt: new Date().toISOString(), stories: [story("d")] },
];

const recent = Array.from({ length: 6 }, (_, i) => ({
  id: `r${i}`, kind: "publicacion", slug: `r${i}`, likeKey: `r${i}`, href: `/publicaciones/r${i}`, likeCount: 0,
  title: `Reciente ${i}`, excerpt: null, imageUrl: null, imageIsExternal: false, categoryId: "", typeLabel: "Publicación",
  sortDate: "", dateLabel: "", images: [],
})) as unknown as HomeItem[];

function open(startTopicId = "t1", onClose = vi.fn()) {
  render(<StoryViewer topics={topics} startTopicId={startTopicId} onClose={onClose} recent={recent} imageSrc={{}} />);
  return onClose;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ liked: true, likeCount: 1 }))));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("StoryViewer", () => {
  it("se abre como diálogo con el nombre del tema", () => {
    open();
    expect(screen.getByRole("dialog", { name: "Historias de Gastronomía" })).toBeInTheDocument();
  });

  it("anuncia en qué historia va", () => {
    open();
    expect(screen.getByText("Historia 1 de 3")).toBeInTheDocument();
  });

  it("las flechas navegan, Shift cambia de tema y Esc cierra", () => {
    const onClose = open();
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(screen.getByText("Historia 2 de 3")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(screen.getByText("Historia 1 de 3")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "ArrowRight", shiftKey: true });
    expect(screen.getByRole("dialog", { name: "Historias de Historia" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("Espacio pausa y reanuda (y hay un botón visible para eso)", () => {
    open();
    fireEvent.keyDown(document, { key: " " });
    expect(screen.getByRole("button", { name: "Reanudar" })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(7_000));
    expect(screen.getByText("Historia 1 de 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reanudar" }));
    expect(screen.getByRole("button", { name: "Pausar" })).toBeInTheDocument();
  });

  it("la píldora lleva al contenido y cuenta el toque", () => {
    open();
    const pill = screen.getByRole("link", { name: "Ver publicación: Diez platos" });
    expect(pill).toHaveAttribute("href", "/publicaciones/diez-platos");
    fireEvent.click(pill);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith("/api/stories/cta?id=a", expect.objectContaining({ method: "POST" }));
  });

  it("deslizar hacia arriba abre el contenido enlazado", () => {
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push, replace: vi.fn(), refresh: vi.fn(), back: vi.fn() } as never);
    open();
    const stage = screen.getByTestId("story-stage");
    stage.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 700 }) as DOMRect;
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 200, clientY: 500 });
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 200, clientY: 400 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 200, clientY: 380 });
    expect(push).toHaveBeenCalledWith("/publicaciones/diez-platos");
  });

  it("doble toque da me gusta", async () => {
    open();
    const stage = screen.getByTestId("story-stage");
    fireEvent.doubleClick(stage);
    await act(async () => {
      await Promise.resolve();
    });
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(expect.stringContaining("/api/content/stories/a/like"), expect.anything());
  });

  it("marca la historia como vista al segundo de mostrarla", () => {
    open();
    expect(isSeen("a")).toBe(false);
    act(() => vi.advanceTimersByTime(1_000));
    expect(isSeen("a")).toBe(true);
  });

  it("después del último tema muestra «Estás al día» con lo más reciente", () => {
    open("t2");
    act(() => vi.advanceTimersByTime(6_100));
    const done = screen.getByRole("region", { name: "Estás al día" });
    expect(within(done).getAllByRole("link", { name: /Reciente/ })).toHaveLength(6);
    expect(within(done).getByRole("link", { name: "Seguir explorando" })).toHaveAttribute("href", "/explorar");
  });

  it("el botón Atrás del navegador cierra", () => {
    const onClose = open();
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    expect(onClose).toHaveBeenCalled();
  });

  it("compartir usa el diálogo del sistema o copia el enlace", async () => {
    const share = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { ...navigator, share });
    open();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Compartir" }));
    });
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: expect.stringMatching(/\/historias\/a$/) }));
  });

  it("un Short detiene el reloj hasta que se cierra", () => {
    open();
    fireEvent.keyDown(document, { key: "ArrowRight" });
    fireEvent.keyDown(document, { key: "ArrowRight" });
    fireEvent.click(screen.getByRole("button", { name: /Reproducir video/ }));
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByText("Historia 3 de 3")).toBeInTheDocument();
  });

  it("la cabecera lleva al feed del tema", () => {
    open();
    expect(screen.getByRole("link", { name: "Ver todo de Gastronomía" })).toHaveAttribute("href", "/categorias/gastronomia");
  });

  it("sin violaciones de accesibilidad", async () => {
    vi.useRealTimers();
    open();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

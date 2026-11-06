import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LikeShareBar } from "./like-share-bar";

const props = {
  type: "EPISODE" as const,
  id: "e1",
  contentType: "episodes" as const,
  slug: "e1",
  initialLikeCount: 7,
  title: "Mi episodio",
};

describe("LikeShareBar (integración de componente: fetch, localStorage, Web Share API/clipboard)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reaccionar y un único botón Compartir, accesible", async () => {
    const { container } = render(<LikeShareBar {...props} />);
    expect(screen.getByRole("button", { name: "7, Reaccionar" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Compartir" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("barra de post (Instagram): sin bordes ni cajas y con las acciones del tipo al lado", () => {
    const { container } = render(
      <LikeShareBar {...props}>
        <a href="https://maps.example">Cómo llegar</a>
      </LikeShareBar>,
    );
    expect(container.querySelector("[class*='border']")).toBeNull();
    expect(screen.getByRole("link", { name: "Cómo llegar" })).toBeInTheDocument();
  });

  it("elegir una reacción la manda con el visitorId y la recuerda", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ counts: { LOVE: 8, FUNNY: 0, WOW: 0, INSPIRED: 0 }, mine: "LOVE" }), { status: 200 }),
    );
    render(<LikeShareBar {...props} />);

    await user.click(screen.getByRole("button", { name: /Reaccionar/ }));
    await user.click(screen.getByRole("button", { name: "Me encanta" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "8, Me encanta: tu reacción. Cambiar o quitar" })).toBeInTheDocument());
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/reactions");
    expect(JSON.parse(init.body as string)).toMatchObject({ type: "EPISODE", id: "e1", reaction: "LOVE" });
    expect(localStorage.getItem("reaction:EPISODE:e1")).toBe("LOVE");
    expect(localStorage.getItem("visitor-id")).toMatch(/[0-9a-f-]{36}/);
  });

  it("si el backend falla, vuelve a como estaba", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 500 }));
    render(<LikeShareBar {...props} />);

    await user.click(screen.getByRole("button", { name: /Reaccionar/ }));
    await user.click(screen.getByRole("button", { name: "Me encanta" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "7, Reaccionar" })).toBeInTheDocument());
    expect(localStorage.getItem("reaction:EPISODE:e1")).toBe("");
  });

  it("Compartir usa el diálogo nativo cuando existe", async () => {
    const user = userEvent.setup();
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    render(<LikeShareBar {...props} />);

    await user.click(screen.getByRole("button", { name: "Compartir" }));

    expect(share).toHaveBeenCalledWith({ title: props.title, url: window.location.href });
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  });

  it("sin Web Share API, Compartir copia el enlace y avisa", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<LikeShareBar {...props} />);

    await user.click(screen.getByRole("button", { name: "Compartir" }));

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(await screen.findByText("Enlace copiado")).toBeInTheDocument();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LikeShareBar } from "./like-share-bar";

const props = { contentType: "articles" as const, slug: "mi-articulo", initialLikeCount: 7, title: "Mi publicación" };

describe("LikeShareBar (integración de componente: fetch, localStorage, Web Share/clipboard)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra el conteo inicial y es accesible", async () => {
    const { container } = render(<LikeShareBar {...props} />);
    expect(screen.getByRole("button", { name: /7\s*Me gusta/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Compartir" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Me gusta llama al endpoint con el visitorId, actualiza el conteo y recuerda el estado", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ liked: true, likeCount: 8 }), { status: 200 }),
    );
    render(<LikeShareBar {...props} />);

    await user.click(screen.getByRole("button", { name: /Me gusta/ }));

    await waitFor(() => expect(screen.getByRole("button", { name: /8\s*Me gusta/ })).toHaveAttribute("aria-pressed", "true"));
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toMatch(/^\/api\/content\/articles\/mi-articulo\/like\?visitorId=[0-9a-f-]{36}$/);
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ method: "POST" });
    expect(localStorage.getItem("liked:articles:mi-articulo")).toBe("1");
    // El visitorId se persiste para deduplicar en el backend.
    expect(localStorage.getItem("visitor-id")).toMatch(/[0-9a-f-]{36}/);
  });

  it("si el backend falla no cambia el conteo ni marca como gustado", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 500 }));
    render(<LikeShareBar {...props} />);

    await user.click(screen.getByRole("button", { name: /Me gusta/ }));

    await waitFor(() => expect(screen.getByRole("button", { name: /Me gusta/ })).toBeEnabled());
    expect(screen.getByRole("button", { name: /7\s*Me gusta/ })).toHaveAttribute("aria-pressed", "false");
    expect(localStorage.getItem("liked:articles:mi-articulo")).toBeNull();
  });

  it("Compartir sin Web Share API copia el enlace y avisa", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<LikeShareBar {...props} />);

    await user.click(screen.getByRole("button", { name: "Compartir" }));

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(await screen.findByRole("button", { name: "Enlace copiado" })).toBeInTheDocument();
  });

  it("Compartir con Web Share API usa el diálogo nativo", async () => {
    const user = userEvent.setup();
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    render(<LikeShareBar {...props} />);

    await user.click(screen.getByRole("button", { name: "Compartir" }));

    expect(share).toHaveBeenCalledWith({ title: "Mi publicación", url: window.location.href });
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  });
});

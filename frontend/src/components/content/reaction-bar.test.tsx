import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { applyReaction, nextReaction, ReactionBar } from "./reaction-bar";

const zero = { LOVE: 0, FUNNY: 0, WOW: 0, INSPIRED: 0 };

describe("reacciones", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("tocar la propia la quita; tocar otra la cambia", () => {
    expect(nextReaction("LOVE", "LOVE")).toBeNull();
    expect(nextReaction("LOVE", "WOW")).toBe("WOW");
    expect(nextReaction(null, "FUNNY")).toBe("FUNNY");
  });

  it("el conteo optimista mueve un voto, nunca baja de cero", () => {
    const state = { counts: { ...zero, LOVE: 3 }, mine: "LOVE" as const };
    expect(applyReaction(state, "WOW")).toEqual({ counts: { ...zero, LOVE: 2, WOW: 1 }, mine: "WOW" });
    expect(applyReaction({ counts: zero, mine: "LOVE" }, null).counts.LOVE).toBe(0);
  });

  it("muestra los conteos, marca la propia y guarda el cambio", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ counts: { ...zero, LOVE: 2 }, mine: null }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ counts: { ...zero, LOVE: 3 }, mine: "LOVE" }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<ReactionBar type="PUBLICATION" id="p1" />);
    const love = await screen.findByRole("button", { name: /Me encanta 2/ });
    expect(love).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(love);
    expect(await screen.findByRole("button", { name: /Me encanta 3/ })).toHaveAttribute("aria-pressed", "true");
    const [, init] = fetchMock.mock.calls[1];
    expect(JSON.parse(init.body)).toMatchObject({ type: "PUBLICATION", id: "p1", reaction: "LOVE" });
  });

  it("si el contenido no admite reacciones no aparece", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    const { container } = render(<ReactionBar type="PUBLICATION" id="p1" />);
    await Promise.resolve();
    expect(container).toBeEmptyDOMElement();
  });
});

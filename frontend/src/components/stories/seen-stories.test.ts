// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { allSeen, isSeen, markSeen, subscribe, SEEN_STORIES_KEY } from "./seen-stories";

const inOneHour = () => new Date(Date.now() + 3_600_000).toISOString();

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("historias vistas (solo en el navegador)", () => {
  it("marca y lee", () => {
    expect(isSeen("a")).toBe(false);
    markSeen("a", inOneHour());
    expect(isSeen("a")).toBe(true);
    expect(allSeen(["a"])).toBe(true);
    expect(allSeen(["a", "b"])).toBe(false);
    expect(allSeen([])).toBe(false);
  });

  it("poda las que ya caducaron", () => {
    localStorage.setItem(SEEN_STORIES_KEY, JSON.stringify({ vieja: new Date(Date.now() - 1000).toISOString() }));
    markSeen("nueva", inOneHour());
    expect(Object.keys(JSON.parse(localStorage.getItem(SEEN_STORIES_KEY)!))).toEqual(["nueva"]);
  });

  it("guarda como mucho 500, se quedan las que caducan más tarde", () => {
    for (let i = 0; i < 505; i++) markSeen(`h${i}`, new Date(Date.now() + 60_000 + i * 1000).toISOString());
    const saved = Object.keys(JSON.parse(localStorage.getItem(SEEN_STORIES_KEY)!));
    expect(saved).toHaveLength(500);
    expect(saved).not.toContain("h0");
    expect(saved).toContain("h504");
  });

  it("con el almacenamiento bloqueado no falla: todo se ve como no visto", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(() => markSeen("a", inOneHour())).not.toThrow();
    expect(isSeen("a")).toBe(false);
  });

  it("avisa a quien escucha cuando cambia", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    markSeen("a", inOneHour());
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    markSeen("b", inOneHour());
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HomeItem } from "@/lib/home-items";
import { ADVANCE_HOLD_MS, ADVANCE_RATIO, UpNext } from "./up-next";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const next = {
  id: "p2",
  kind: "publicacion",
  slug: "mercado-de-huamanga",
  likeKey: "mercado-de-huamanga",
  href: "/publicaciones/mercado-de-huamanga",
  likeCount: 0,
  title: "El mercado central de Huamanga",
  excerpt: null,
  imageUrl: "/api/v1/images/1/file",
  imageIsExternal: false,
  categoryId: "c1",
  typeLabel: "Publicación",
  sortDate: "2026-10-01T00:00:00Z",
  dateLabel: "",
  images: [],
} as HomeItem;

let trigger: (entries: { isIntersecting: boolean; intersectionRatio: number }[]) => void = () => {};

beforeEach(() => {
  push.mockReset();
  vi.useFakeTimers();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: typeof trigger) {
        trigger = cb;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("UpNext", () => {
  it("sin siguiente no pinta nada", () => {
    const { container } = render(<UpNext item={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra «Sigue» con el título y se puede tocar", () => {
    render(<UpNext item={next} />);
    expect(screen.getByText("Sigue")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /El mercado central de Huamanga/ })).toHaveAttribute("href", next.href);
  });

  it("ver la tarjeta asomando no navega: hace falta que la portada llene la pantalla", () => {
    render(<UpNext item={next} />);
    act(() => trigger([{ isIntersecting: true, intersectionRatio: 0.6 }]));
    act(() => vi.advanceTimersByTime(2000));
    expect(push).not.toHaveBeenCalled();
  });

  it("pasa a la siguiente cuando la persona la subió hasta llenar la pantalla y se quedó ahí", () => {
    render(<UpNext item={next} />);
    act(() => trigger([{ isIntersecting: true, intersectionRatio: ADVANCE_RATIO }]));
    act(() => vi.advanceTimersByTime(ADVANCE_HOLD_MS));
    expect(push).toHaveBeenCalledWith(next.href);
  });

  it("si vuelve a subir antes de tiempo no navega", () => {
    render(<UpNext item={next} />);
    act(() => trigger([{ isIntersecting: true, intersectionRatio: ADVANCE_RATIO }]));
    act(() => vi.advanceTimersByTime(ADVANCE_HOLD_MS - 100));
    act(() => trigger([{ isIntersecting: true, intersectionRatio: 0.5 }]));
    act(() => vi.advanceTimersByTime(1000));
    expect(push).not.toHaveBeenCalled();
  });
});

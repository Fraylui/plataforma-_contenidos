import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FloatingReactions } from "./floating-reactions";

const base = { contentType: "publications" as const, slug: "mercado", title: "Mercado" };

describe("FloatingReactions", () => {
  it("sin me gusta todavía no muestra «0» (como en el feed)", () => {
    render(<FloatingReactions {...base} initialLikeCount={0} />);
    const like = screen.getByRole("button", { name: /Me gusta/ });
    expect(like).not.toHaveTextContent("0");
    expect(screen.getByRole("button", { name: "Compartir" })).toBeInTheDocument();
  });

  it("con me gusta muestra el número", () => {
    render(<FloatingReactions {...base} initialLikeCount={12} />);
    expect(screen.getByRole("button", { name: /Me gusta/ })).toHaveTextContent("12");
  });

  it("en celular se aparta mientras se baja leyendo y vuelve al detenerse o subir", () => {
    vi.useFakeTimers();
    render(<FloatingReactions {...base} initialLikeCount={0} />);
    const group = screen.getByRole("group", { name: "Reacciones" });
    expect(group).toHaveAttribute("data-hidden", "false");
    act(() => {
      window.scrollY = 300;
      fireEvent.scroll(window);
    });
    expect(group).toHaveAttribute("data-hidden", "true");
    act(() => vi.advanceTimersByTime(800));
    expect(group).toHaveAttribute("data-hidden", "false");
    act(() => {
      window.scrollY = 600;
      fireEvent.scroll(window);
    });
    act(() => {
      window.scrollY = 500;
      fireEvent.scroll(window);
    });
    expect(group).toHaveAttribute("data-hidden", "false");
    vi.useRealTimers();
  });
});

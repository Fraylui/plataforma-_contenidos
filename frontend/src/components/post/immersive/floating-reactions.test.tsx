import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FloatingReactions } from "./floating-reactions";

const base = { type: "PUBLICATION" as const, id: "p1", contentType: "publications" as const, slug: "mercado", title: "Mercado" };

describe("FloatingReactions", () => {
  it("sin reacciones todavía no muestra «0»; el botón abre las cuatro reacciones", () => {
    render(<FloatingReactions {...base} initialLikeCount={0} />);
    const group = screen.getByRole("group", { name: "Reacciones" });
    expect(group).not.toHaveTextContent("0");
    fireEvent.click(screen.getByRole("button", { name: "Reaccionar" }));
    expect(screen.getAllByRole("button", { name: /^Me (encanta|divierte|sorprende|inspira)$/ })).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Compartir" })).toBeInTheDocument();
  });

  it("los «me gusta» de antes cuentan como reacciones", () => {
    render(<FloatingReactions {...base} initialLikeCount={12} />);
    expect(screen.getByRole("group", { name: "Reacciones" })).toHaveTextContent("12");
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

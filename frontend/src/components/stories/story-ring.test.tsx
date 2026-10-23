import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoryRing } from "./story-ring";
import { StoriesOpenContext } from "./stories-context";
import { markSeen } from "./seen-stories";

const topic = { categoryId: "t1", name: "Gastronomía", slug: "gastronomia", coverUrl: null, hasNew: false };
const inOneHour = () => new Date(Date.now() + 3_600_000).toISOString();

beforeEach(() => localStorage.clear());

describe("StoryRing", () => {
  it("sin visor disponible es un enlace al tema (si el JavaScript falla, igual lleva al feed)", () => {
    render(<StoryRing topic={topic} storyIds={["s1"]} />);
    const link = screen.getByRole("link", { name: /Ver historias de Gastronomía/ });
    expect(link).toHaveAttribute("href", "/categorias/gastronomia");
    expect(link).not.toHaveAttribute("aria-haspopup");
  });

  it("anillo «sin ver» hasta que se vieron todas, luego gris", () => {
    const { container, rerender } = render(<StoryRing topic={topic} storyIds={["s1", "s2"]} />);
    expect(container.querySelector("[data-ring]")).toHaveAttribute("data-ring", "unseen");
    markSeen("s1", inOneHour());
    markSeen("s2", inOneHour());
    rerender(<StoryRing topic={topic} storyIds={["s1", "s2"]} />);
    expect(container.querySelector("[data-ring]")).toHaveAttribute("data-ring", "seen");
  });

  it("con el visor disponible, tocar abre las historias del tema en vez de navegar", () => {
    const open = vi.fn();
    render(
      <StoriesOpenContext.Provider value={{ open, prefetch: vi.fn() }}>
        <StoryRing topic={topic} storyIds={["s1"]} />
      </StoriesOpenContext.Provider>,
    );
    const link = screen.getByRole("link", { name: /Ver historias de Gastronomía/ });
    expect(link).toHaveAttribute("aria-haspopup", "dialog");
    const notPrevented = fireEvent.click(link);
    expect(notPrevented).toBe(false);
    expect(open).toHaveBeenCalledWith("t1", expect.any(Object));
  });

  it("precarga el visor al acercar el dedo o el mouse", () => {
    const prefetch = vi.fn();
    render(
      <StoriesOpenContext.Provider value={{ open: vi.fn(), prefetch }}>
        <StoryRing topic={topic} storyIds={["s1"]} />
      </StoriesOpenContext.Provider>,
    );
    fireEvent.pointerEnter(screen.getByRole("link"));
    expect(prefetch).toHaveBeenCalled();
  });

  it("sin violaciones de accesibilidad", async () => {
    const { container } = render(<ul><li><StoryRing topic={topic} storyIds={["s1"]} /></li></ul>);
    expect(await axe(container)).toHaveNoViolations();
  });
});

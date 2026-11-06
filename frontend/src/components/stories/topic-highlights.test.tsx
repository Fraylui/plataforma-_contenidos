import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { StoriesOpenContext } from "./stories-context";
import { TopicHighlights } from "./topic-highlights";
import { StoryEnded } from "./story-ended";

function withOpener(ui: React.ReactNode, open = vi.fn()) {
  return render(<StoriesOpenContext.Provider value={{ open, prefetch: vi.fn() }}>{ui}</StoriesOpenContext.Provider>);
}

describe("TopicHighlights", () => {
  it("sin Destacadas no muestra nada", () => {
    const { container } = withOpener(<TopicHighlights topicId="t1" count={0} coverUrl={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("con Destacadas es un botón que abre el visor", () => {
    const open = vi.fn();
    withOpener(<TopicHighlights topicId="t1" count={3} coverUrl={null} />, open);
    const button = screen.getByRole("button", { name: "Destacadas · 3" });
    expect(button).toHaveAttribute("aria-haspopup", "dialog");
    fireEvent.click(button);
    expect(open).toHaveBeenCalledWith("t1", expect.any(Object));
  });

  it("sin visor disponible no se muestra (no hay a dónde llevar)", () => {
    const { container } = render(<TopicHighlights topicId="t1" count={3} coverUrl={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("sin violaciones de accesibilidad", async () => {
    const { container } = withOpener(<TopicHighlights topicId="t1" count={2} coverUrl={null} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("StoryEnded", () => {
  it("dice que terminó y ofrece seguir", () => {
    render(<StoryEnded recent={[]} />);
    expect(screen.getByRole("heading", { name: "Esta historia ya terminó" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Explorar" })).toHaveAttribute("href", "/explorar");
  });
});

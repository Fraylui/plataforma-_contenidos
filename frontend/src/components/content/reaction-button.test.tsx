import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { pillReactions, ReactionButton, triggerLabel } from "./reaction-button";
import { fullCounts } from "./use-reaction";

describe("pillReactions", () => {
  it("sin reacciones muestra las cuatro (invitan a tocar)", () => {
    expect(pillReactions(fullCounts(), null)).toEqual(["LOVE", "FUNNY", "WOW", "INSPIRED"]);
  });

  it("la propia primero y luego las más usadas, hasta tres", () => {
    expect(pillReactions(fullCounts({ LOVE: 5, WOW: 2, INSPIRED: 1, FUNNY: 1 }), "FUNNY")).toEqual(["FUNNY", "LOVE", "WOW"]);
    expect(pillReactions(fullCounts({ LOVE: 1, WOW: 9 }), null)).toEqual(["WOW", "LOVE"]);
  });
});

describe("triggerLabel", () => {
  it("empieza con lo que se ve: el total y luego qué hace", () => {
    expect(triggerLabel(null, 0)).toBe("Reaccionar");
    expect(triggerLabel(null, 12)).toBe("12, Reaccionar");
    expect(triggerLabel("WOW", 3)).toBe("3, Me sorprende: tu reacción. Cambiar o quitar");
  });
});

describe("ReactionButton", () => {
  it("una píldora sin texto: íconos y total; la bandeja abre con las cuatro y su conteo", async () => {
    const onReact = vi.fn();
    const { container } = render(<ReactionButton mine={null} counts={fullCounts({ LOVE: 4, FUNNY: 1 })} onReact={onReact} />);
    const trigger = screen.getByRole("button", { name: "5, Reaccionar" });
    expect(trigger).toHaveTextContent(/^5$/);

    await userEvent.click(trigger);
    expect(screen.getByRole("group", { name: "Elige una reacción" })).toHaveTextContent(/Me encanta4.*Me divierte1/);
    await userEvent.click(screen.getByRole("button", { name: "Me inspira" }));
    expect(onReact).toHaveBeenCalledWith("INSPIRED");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("tocar la reacción propia en la bandeja la quita; Escape cierra sin cambiar nada", async () => {
    const onReact = vi.fn();
    render(<ReactionButton mine="LOVE" counts={fullCounts({ LOVE: 1 })} onReact={onReact} />);
    await userEvent.click(screen.getByRole("button", { name: /Me encanta: tu reacción/ }));
    expect(screen.getByRole("button", { name: "Me encanta" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("group", { name: "Elige una reacción" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Me encanta: tu reacción/ }));
    await userEvent.click(screen.getByRole("button", { name: "Me encanta" }));
    expect(onReact).toHaveBeenCalledWith(null);
  });

  it("al elegir salen confeti e íconos flotando (los efectos del feed)", async () => {
    const { container, rerender } = render(<ReactionButton mine={null} counts={fullCounts()} onReact={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Reaccionar" }));
    await userEvent.click(screen.getByRole("button", { name: "Me sorprende" }));
    rerender(<ReactionButton mine="WOW" counts={fullCounts({ WOW: 1 })} onReact={() => {}} />);
    expect(container.querySelectorAll("[class*='float-up']").length).toBeGreaterThan(0);
    expect(container.querySelectorAll("[class*='reaction-burst']").length).toBeGreaterThan(0);
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { Checkbox, Radio } from "./checkbox";

describe("Checkbox y Radio", () => {
  it("la etiqueta es parte del control y se puede marcar", async () => {
    const { container } = render(<Checkbox label="Destacado" description="Aparece primero en el inicio" />);
    const box = screen.getByRole("checkbox", { name: "Destacado" });
    await userEvent.click(screen.getByText("Destacado"));
    expect(box).toBeChecked();
    expect(box).toHaveAccessibleDescription("Aparece primero en el inicio");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("radio con etiqueta", () => {
    render(<Radio name="formato" value="a" label="Cuadrado" />);
    expect(screen.getByRole("radio", { name: "Cuadrado" })).toBeInTheDocument();
  });
});

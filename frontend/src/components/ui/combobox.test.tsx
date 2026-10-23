import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { Combobox } from "./combobox";
import { Field } from "./field";

const OPTIONS = [
  { id: "cultura", label: "Cultura" },
  { id: "viajes", label: "Viajes" },
];

describe("Combobox", () => {
  it("dentro de Field: etiquetado, inválido con error y elige una opción", async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <Field label="Tema" name="topic" error="Elige un tema">
        <Combobox options={OPTIONS} value={null} onSelect={onSelect} />
      </Field>,
    );
    const trigger = screen.getByRole("combobox", { name: "Tema" });
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(await axe(container)).toHaveNoViolations();

    await userEvent.click(trigger);
    await userEvent.click(await screen.findByText("Viajes"));
    expect(onSelect).toHaveBeenCalledWith("viajes");
  });
});

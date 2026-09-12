import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { TagInput } from "./tag-input";

/** Arnés controlado: el componente es "controlado" (value/onChange), así que se prueba como lo usa el formulario real. */
function Harness({ initial = [] as string[], onChange = vi.fn() }) {
  const [tags, setTags] = useState<string[]>(initial);
  return (
    <TagInput
      value={tags}
      onChange={(next) => {
        setTags(next);
        onChange(next);
      }}
    />
  );
}

describe("TagInput (integración de componente con interacción real de usuario)", () => {
  it("agrega una etiqueta con Enter y limpia el borrador", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const input = screen.getByPlaceholderText("Escribe y presiona Enter…");
    await user.type(input, "  gastronomía  {Enter}");

    expect(onChange).toHaveBeenLastCalledWith(["gastronomía"]);
    expect(screen.getByText("gastronomía")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("la coma también confirma y los duplicados se ignoran", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={["viajes"]} onChange={onChange} />);

    await user.type(screen.getByRole("textbox"), "viajes,");
    expect(onChange).not.toHaveBeenCalled();

    await user.type(screen.getByRole("textbox"), "cultura,");
    expect(onChange).toHaveBeenLastCalledWith(["viajes", "cultura"]);
  });

  it("Backspace con el borrador vacío quita la última etiqueta", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={["a", "b"]} onChange={onChange} />);

    await user.type(screen.getByRole("textbox"), "{Backspace}");
    expect(onChange).toHaveBeenLastCalledWith(["a"]);
  });

  it("el botón × quita esa etiqueta concreta y es accesible", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Harness initial={["a", "b", "c"]} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Quitar etiqueta b" }));
    expect(onChange).toHaveBeenLastCalledWith(["a", "c"]);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("al perder el foco confirma lo que quedó escrito", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.type(screen.getByRole("textbox"), "pendiente");
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(["pendiente"]);
  });
});

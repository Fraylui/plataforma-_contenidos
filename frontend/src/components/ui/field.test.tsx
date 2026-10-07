import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { Field } from "./field";
import { TextInput } from "./text-input";
import { Select } from "./select";
import { TextArea } from "./text-area";

describe("Field", () => {
  it("conecta la etiqueta con el control y le da name", async () => {
    const { container } = render(
      <Field label="Título" name="title">
        <TextInput />
      </Field>,
    );
    const input = screen.getByLabelText("Título");
    expect(input).toHaveAttribute("id", "title");
    expect(input).toHaveAttribute("name", "title");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("un id explícito del control gana y la etiqueta apunta a él", () => {
    render(
      <Field label="Contraseña actual" name="current">
        <TextInput id="current-password" type="password" />
      </Field>,
    );
    expect(screen.getByLabelText("Contraseña actual")).toHaveAttribute("id", "current-password");
  });

  it("con error marca aria-invalid y lo describe junto a la ayuda", async () => {
    const { container } = render(
      <Field label="Correo" name="email" hint="Lo usarás para entrar" error="Correo inválido">
        <TextInput type="email" />
      </Field>,
    );
    const input = screen.getByLabelText("Correo");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Lo usarás para entrar Correo inválido");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("obligatorio: el control es required", () => {
    render(
      <Field label="Nombre" name="name" required>
        <TextInput />
      </Field>,
    );
    expect(screen.getByLabelText(/Nombre/)).toBeRequired();
  });

  it("también conecta select y textarea nativos o del sistema", () => {
    render(
      <>
        <Field label="Tipo" name="type">
          <Select>
            <option value="a">A</option>
          </Select>
        </Field>
        <Field label="Texto" name="body">
          <textarea />
        </Field>
        <Field label="Resumen" name="summary">
          <TextArea maxLength={10} />
        </Field>
      </>,
    );
    expect(screen.getByLabelText("Tipo").tagName).toBe("SELECT");
    expect(screen.getByLabelText("Texto")).toHaveAttribute("name", "body");
    expect(screen.getByLabelText("Resumen").tagName).toBe("TEXTAREA");
  });
});

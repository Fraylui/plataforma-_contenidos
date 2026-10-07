import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { Button, IconButton, LinkButton } from "./button";

describe("Button", () => {
  it("cargando: queda deshabilitado, avisa aria-busy y conserva el texto", async () => {
    const { container } = render(<Button loading>Guardar</Button>);
    const button = screen.getByRole("button", { name: "Guardar" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(container.querySelector("[data-spinner]")).toHaveAttribute("aria-hidden", "true");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("por defecto es type=button para no enviar formularios sin querer", () => {
    render(<Button>Cancelar</Button>);
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveAttribute("type", "button");
  });

  it("IconButton usa la etiqueta como nombre accesible", async () => {
    const { container } = render(<IconButton label="Cerrar" icon={<svg />} />);
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("LinkButton es un enlace", () => {
    render(<LinkButton href="/admin/eventos/nuevo">Crear evento</LinkButton>);
    expect(screen.getByRole("link", { name: "Crear evento" })).toHaveAttribute("href", "/admin/eventos/nuevo");
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { useRouter } from "next/navigation";
import { CommandPaletteProvider, CommandPaletteTrigger } from "./command-palette";

const NAV = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/eventos", label: "Agenda" },
  { href: "/admin/cuenta", label: "Mi cuenta" },
];
const CREATE = [{ label: "Evento", href: "/admin/eventos/nuevo" }];

function renderPalette() {
  const push = vi.fn();
  vi.mocked(useRouter).mockReturnValue({ push, replace: vi.fn(), refresh: vi.fn(), back: vi.fn() } as never);
  const utils = render(
    <CommandPaletteProvider navItems={NAV} createItems={CREATE}>
      <CommandPaletteTrigger />
    </CommandPaletteProvider>,
  );
  return { ...utils, push };
}

describe("Paleta de comandos del panel", () => {
  it("Ctrl+K la abre con «Ir a» y «Crear»", async () => {
    renderPalette();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(await screen.findByRole("dialog", { name: "Buscar o ir a" })).toBeInTheDocument();
    expect(screen.getByText("Ir a")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Crear evento" })).toBeInTheDocument();
  });

  it("también se abre con el botón y escribir filtra; Enter navega", async () => {
    const { push } = renderPalette();
    await userEvent.click(screen.getByRole("button", { name: /Buscar o ir a/ }));
    await userEvent.type(screen.getByRole("combobox"), "cuen");
    expect(screen.getByRole("option", { name: /Mi cuenta/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Agenda/ })).not.toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    expect(push).toHaveBeenCalledWith("/admin/cuenta");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sin coincidencias lo dice", async () => {
    renderPalette();
    await userEvent.click(screen.getByRole("button", { name: /Buscar o ir a/ }));
    await userEvent.type(screen.getByRole("combobox"), "zzz");
    expect(screen.getByText("Nada coincide con «zzz».")).toBeInTheDocument();
  });

  it("es accesible", async () => {
    const { baseElement } = renderPalette();
    await userEvent.click(screen.getByRole("button", { name: /Buscar o ir a/ }));
    expect(await axe(baseElement)).toHaveNoViolations();
  });
});

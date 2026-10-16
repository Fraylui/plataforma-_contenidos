import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import { LeftRail } from "./left-rail";

const brand = { name: "Ecos del Camino", logoUrl: null };

describe("LeftRail — «Buscar» abre un panel lateral (como Instagram)", () => {
  it("abre un diálogo «Buscar» con el campo enfocado y Esc lo cierra", async () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<LeftRail brand={brand} />);
    await userEvent.click(screen.getByRole("button", { name: "Buscar" }));
    const panel = screen.getByRole("dialog", { name: "Buscar" });
    await waitFor(() => expect(panel.querySelector("input")).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Buscar" })).not.toBeInTheDocument();
    // Margen amplio: con la CPU ocupada (p. ej. un build de Docker en paralelo) el diálogo de Radix superó los 5 s por defecto.
  }, 15_000);
});

describe("LeftRail — sin selector de apariencia: claro u oscuro según el dispositivo", () => {
  it("no hay «Más» ni selector de apariencia; los enlaces legales están a la vista al pie", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<LeftRail brand={brand} />);
    expect(screen.queryByRole("button", { name: "Más" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Apariencia" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Legal" })).getByRole("link", { name: "Privacidad" })).toHaveAttribute("href", "/privacidad");
  });

  it("«Información» (modo íconos) abre los enlaces legales", async () => {
    vi.mocked(usePathname).mockReturnValue("/");
    const { container } = render(<LeftRail brand={brand} />);
    await userEvent.click(screen.getByRole("button", { name: "Información" }));
    expect(screen.getByRole("menuitem", { name: "Términos" })).toHaveAttribute("href", "/terminos");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("LeftRail — temas como historias", () => {
  it("un tema con novedades lo dice a la vista", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(
      <LeftRail
        brand={brand}
       
        topics={[
          { categoryId: "t1", name: "Turismo", slug: "turismo", coverUrl: null, hasNew: true },
          { categoryId: "t2", name: "Historia", slug: "historia", coverUrl: null, hasNew: false },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: /Turismo/ })).toHaveTextContent("Novedades");
    expect(screen.getByRole("link", { name: /Historia/ })).not.toHaveTextContent("Novedades");
  });
});

describe("LeftRail — Celebraciones sin pestaña (modelo Google)", () => {
  it("no hay pestaña Agenda: Celebraciones está en Secciones cuando hay contenido", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<LeftRail brand={brand} sections={{ "/celebraciones": true }} />);
    expect(screen.queryByRole("link", { name: /Agenda/ })).not.toBeInTheDocument();
    const sections = screen.getByRole("navigation", { name: "Secciones" });
    expect(within(sections).getByRole("link", { name: "Celebraciones" })).toHaveAttribute("href", "/celebraciones");
  });
});

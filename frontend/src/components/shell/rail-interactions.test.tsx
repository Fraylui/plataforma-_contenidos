import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import { LeftRail } from "./left-rail";
import { countThisWeek } from "./agenda-count";

const brand = { name: "Ecos del Camino", logoUrl: null };

describe("LeftRail — «Buscar» abre un panel lateral (como Instagram)", () => {
  it("abre un diálogo «Buscar» con el campo enfocado y Esc lo cierra", async () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<LeftRail brand={brand} showAgenda />);
    await userEvent.click(screen.getByRole("button", { name: "Buscar" }));
    const panel = screen.getByRole("dialog", { name: "Buscar" });
    await waitFor(() => expect(panel.querySelector("input")).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Buscar" })).not.toBeInTheDocument();
  });
});

describe("LeftRail — sin selector de apariencia: claro u oscuro según el dispositivo", () => {
  it("no hay «Más» ni selector de apariencia; los enlaces legales están a la vista al pie", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<LeftRail brand={brand} showAgenda />);
    expect(screen.queryByRole("button", { name: "Más" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Apariencia" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Legal" })).getByRole("link", { name: "Privacidad" })).toHaveAttribute("href", "/privacidad");
  });

  it("«Información» (modo íconos) abre los enlaces legales", async () => {
    vi.mocked(usePathname).mockReturnValue("/");
    const { container } = render(<LeftRail brand={brand} showAgenda />);
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
        showAgenda
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

describe("LeftRail — contador de Agenda", () => {
  it("muestra los eventos de los próximos 7 días", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<LeftRail brand={brand} showAgenda agendaCount={3} />);
    expect(screen.getByRole("link", { name: /Agenda/ })).toHaveAccessibleName("Agenda, 3 eventos esta semana");
  });

  it("sin eventos en la semana no muestra contador", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<LeftRail brand={brand} showAgenda agendaCount={0} />);
    expect(screen.getByRole("link", { name: /Agenda/ })).toHaveAccessibleName("Agenda");
  });
});

describe("countThisWeek", () => {
  it("cuenta los eventos que empiezan en los próximos 7 días", () => {
    const now = new Date("2026-10-06T12:00:00Z");
    const starts = ["2026-10-07T00:00:00Z", "2026-10-13T11:00:00Z", "2026-10-14T00:00:00Z", null, "garbage"];
    expect(countThisWeek(starts, now)).toBe(2);
  });
});

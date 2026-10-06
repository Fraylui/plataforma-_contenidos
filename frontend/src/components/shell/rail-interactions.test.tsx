import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import { BottomTabBar } from "./bottom-tab-bar";
import { LeftRail } from "./left-rail";
import { countThisWeek } from "./agenda-count";
import { THEME_PREF_KEY, applyThemePref, themeInitScript } from "./theme-pref";

const brand = { name: "Ecos del Camino", logoUrl: null };

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

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

describe("LeftRail — menú «Más» con apariencia por visitante", () => {
  it("elegir «Oscuro» pone data-theme=dark en <html> y lo guarda", async () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<LeftRail brand={brand} showAgenda />);
    await userEvent.click(screen.getByRole("button", { name: "Más" }));
    expect(screen.getByRole("menuitemradio", { name: "Sistema" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitem", { name: "Privacidad" })).toHaveAttribute("href", "/privacidad");
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Oscuro" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(THEME_PREF_KEY)).toBe("dark");
  });

  it("no tiene problemas de accesibilidad con el menú abierto", async () => {
    vi.mocked(usePathname).mockReturnValue("/");
    const { container } = render(<LeftRail brand={brand} showAgenda />);
    await userEvent.click(screen.getByRole("button", { name: "Más" }));
    expect(await axe(container)).toHaveNoViolations();
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

describe("theme-pref", () => {
  it("«Sistema» quita data-theme (manda el sistema operativo) y se guarda", () => {
    document.documentElement.dataset.theme = "light";
    applyThemePref("system");
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem(THEME_PREF_KEY)).toBe("system");
  });

  it("el script del <head> aplica lo guardado y, sin preferencia, respeta la configuración del panel", () => {
    document.documentElement.dataset.theme = "light";
    new Function(themeInitScript)();
    expect(document.documentElement.dataset.theme).toBe("light");
    localStorage.setItem(THEME_PREF_KEY, "dark");
    new Function(themeInitScript)();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("cuenta los eventos que empiezan en los próximos 7 días", () => {
    const now = new Date("2026-10-06T12:00:00Z");
    const starts = ["2026-10-07T00:00:00Z", "2026-10-13T11:00:00Z", "2026-10-14T00:00:00Z", null, "garbage"];
    expect(countThisWeek(starts, now)).toBe(2);
  });
});

describe("BottomTabBar — la hoja «Más» también elige apariencia (celular)", () => {
  it("elegir «Claro» pone data-theme=light y lo guarda", async () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<BottomTabBar showAgenda />);
    await userEvent.click(screen.getByRole("button", { name: "Más" }));
    const sheet = screen.getByRole("dialog", { name: "Más" });
    expect(within(sheet).getByRole("radio", { name: "Sistema" })).toBeChecked();
    await userEvent.click(within(sheet).getByRole("radio", { name: "Claro" }));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_PREF_KEY)).toBe("light");
  });
});

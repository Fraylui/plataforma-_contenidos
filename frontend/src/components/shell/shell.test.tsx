import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { BottomTabBar } from "./bottom-tab-bar";
import { LeftRail } from "./left-rail";
import { activeTab } from "./shell-nav";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

const brand = { name: "Ecos del Camino", logoUrl: null };

describe("activeTab", () => {
  it("Agenda para eventos (listado y detalle), Explorar y Buscar en sus páginas, Inicio en el resto", () => {
    expect(activeTab("/eventos")).toBe("agenda");
    expect(activeTab("/eventos/feria-de-santa-ana")).toBe("agenda");
    expect(activeTab("/explorar")).toBe("explorar");
    expect(activeTab("/buscar")).toBe("buscar");
    expect(activeTab("/")).toBe("inicio");
    expect(activeTab("/lugares/mirador")).toBe("inicio");
  });
});

describe("BottomTabBar", () => {
  it("marca la pestaña activa con aria-current y oculta Agenda si no hay eventos", () => {
    pathname = "/eventos/feria";
    const { rerender } = render(<BottomTabBar showAgenda />);
    expect(screen.getByRole("link", { name: "Agenda" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Inicio" })).not.toHaveAttribute("aria-current");
    rerender(<BottomTabBar showAgenda={false} />);
    expect(screen.queryByRole("link", { name: "Agenda" })).not.toBeInTheDocument();
  });

  it("«Más» abre una hoja con Contacto, Privacidad y Términos", async () => {
    pathname = "/";
    render(<BottomTabBar showAgenda />);
    await userEvent.click(screen.getByRole("button", { name: "Más" }));
    const sheet = screen.getByRole("dialog", { name: "Más" });
    expect(sheet).toHaveTextContent("Contacto");
    expect(sheet).toHaveTextContent("Privacidad");
    expect(sheet).toHaveTextContent("Términos");
  });

  it("no tiene problemas de accesibilidad", async () => {
    pathname = "/";
    const { container } = render(<BottomTabBar showAgenda />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("LeftRail", () => {
  it("muestra la marca y las mismas secciones, con la activa marcada", () => {
    pathname = "/explorar";
    render(<LeftRail brand={brand} showAgenda />);
    expect(screen.getByRole("link", { name: /Ecos del Camino/ })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Explorar" })).toHaveAttribute("aria-current", "page");
  });
});

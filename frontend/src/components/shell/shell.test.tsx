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

describe("LeftRail — sin vacío, como Facebook/X", () => {
  it("muestra secciones con contenido y temas con su foto", () => {
    pathname = "/lugares";
    render(
      <LeftRail
        brand={brand}
        showAgenda
        sections={{ "/publicaciones": true, "/lugares": true, "/galerias": false, "/directorio": true }}
        topics={[{ categoryId: "t1", name: "Turismo", slug: "turismo", coverUrl: null, hasNew: true }]}
      />,
    );
    expect(screen.getByRole("link", { name: "Lugares" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Galerías" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Turismo/ })).toHaveAttribute("href", "/categorias/turismo");
  });
});

describe("LeftRail — temas con «Ver más» (como Facebook)", () => {
  it("muestra 5 temas y despliega el resto con «Ver más»", async () => {
    pathname = "/";
    const topics = Array.from({ length: 8 }, (_, i) => ({ categoryId: `t${i}`, name: `Tema ${i}`, slug: `tema-${i}`, coverUrl: null, hasNew: false }));
    render(<LeftRail brand={brand} showAgenda topics={topics} />);
    const nav = screen.getByRole("navigation", { name: "Temas del menú" });
    expect(nav.querySelectorAll("a")).toHaveLength(5);
    await userEvent.click(screen.getByRole("button", { name: "Ver más temas" }));
    expect(nav.querySelectorAll("a")).toHaveLength(8);
    expect(screen.getByRole("button", { name: "Ver menos temas" })).toHaveAttribute("aria-expanded", "true");
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

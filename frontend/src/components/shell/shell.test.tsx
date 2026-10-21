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
  it("Explorar y Buscar en sus páginas; Inicio en el resto, también Celebraciones (sin pestaña)", () => {
    expect(activeTab("/celebraciones")).toBe("inicio");
    expect(activeTab("/explorar")).toBe("explorar");
    expect(activeTab("/buscar")).toBe("buscar");
    expect(activeTab("/")).toBe("inicio");
    expect(activeTab("/lugares/mirador")).toBe("inicio");
  });
});

describe("BottomTabBar", () => {
  it("marca la pestaña activa con aria-current; ya no hay pestaña Agenda", () => {
    pathname = "/explorar";
    render(<BottomTabBar />);
    expect(screen.getByRole("link", { name: "Explorar" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Inicio" })).not.toHaveAttribute("aria-current");
    expect(screen.queryByRole("link", { name: "Agenda" })).not.toBeInTheDocument();
  });

  it("«Más» abre una hoja con Celebraciones, Contacto, Privacidad y Términos", async () => {
    pathname = "/";
    render(<BottomTabBar />);
    await userEvent.click(screen.getByRole("button", { name: "Más" }));
    const sheet = await screen.findByRole("dialog", { name: "Más" });
    expect(sheet).toHaveTextContent("Celebraciones");
    expect(sheet).toHaveTextContent("Contacto");
    expect(sheet).toHaveTextContent("Privacidad");
    expect(sheet).toHaveTextContent("Términos");
  });

  it("no tiene problemas de accesibilidad", async () => {
    pathname = "/";
    const { container } = render(<BottomTabBar />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("LeftRail — sin vacío, como Facebook/X", () => {
  it("muestra secciones con contenido y temas con su foto", () => {
    pathname = "/lugares";
    render(
      <LeftRail
        brand={brand}
       
        sections={{ "/publicaciones": true, "/lugares": true, "/galerias": false }}
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
    render(<LeftRail brand={brand} topics={topics} />);
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
    render(<LeftRail brand={brand} />);
    expect(screen.getByRole("link", { name: /Ecos del Camino/ })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Explorar" })).toHaveAttribute("aria-current", "page");
  });
});

describe("Nuestras redes («Síguenos»)", () => {
  const social = [{ key: "instagram" as const, label: "Instagram", url: "https://instagram.com/ecos" }];

  it("el menú lateral las muestra al pie", () => {
    render(<LeftRail brand={brand} social={social} />);
    expect(screen.getByRole("link", { name: "Ecos del Camino en Instagram" })).toHaveAttribute("href", "https://instagram.com/ecos");
  });

  it("en el celular están en la hoja «Más»", async () => {
    render(<BottomTabBar brandName="Ecos del Camino" social={social} />);
    await userEvent.click(screen.getByRole("button", { name: "Más" }));
    const sheet = await screen.findByRole("dialog", { name: "Más" });
    expect(sheet).toContainElement(screen.getByRole("link", { name: "Ecos del Camino en Instagram" }));
  });
});

describe("Logo para modo oscuro", () => {
  it("si está configurado, el navegador lo usa en modo oscuro", () => {
    const { container } = render(<LeftRail brand={{ name: "Ecos", logoUrl: "/logo.png", logoDarkUrl: "/logo-claro.png" }} />);
    const source = container.querySelector('source[media="(prefers-color-scheme: dark)"]');
    expect(source).toHaveAttribute("srcset", "/logo-claro.png");
  });
});

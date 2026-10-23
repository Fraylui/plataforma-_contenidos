import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import { AccountMenu } from "./account-menu";
import { CreateMenu } from "./create-menu";
import { Sidebar } from "./sidebar";
import { SIDEBAR_COOKIE } from "./constants";
import { MobileTabBar } from "./mobile-tab-bar";
import { CommandPaletteProvider } from "./command-palette";

vi.mock("@/app/admin/(protected)/actions", () => ({ logoutAction: vi.fn() }));

const GROUPS = [
  { group: "principal" as const, label: null, items: [{ href: "/admin", label: "Inicio", icon: <svg />, activeIcon: <svg /> }] },
  {
    group: "contenido" as const,
    label: "Contenido",
    items: [{ href: "/admin/publicaciones", label: "Publicaciones", icon: <svg />, activeIcon: <svg /> }],
  },
];
const CREATE = [
  { label: "Publicación", href: "/admin/publicaciones/nuevo" },
  { label: "Celebración", href: "/admin/celebraciones/nuevo" },
];

describe("Menú de cuenta", () => {
  it("muestra quién es y deja ir a Mi cuenta, ver el sitio y cerrar sesión", async () => {
    render(<AccountMenu firstName="Fray" lastName="Luis" email="fray@test.pe" roleLabel="Dueño" />);
    const trigger = screen.getByRole("button", { name: "Cuenta de Fray Luis" });
    expect(trigger).toHaveTextContent("FL");
    await userEvent.click(trigger);
    expect(await screen.findByText("fray@test.pe")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Mi cuenta/ })).toHaveAttribute("href", "/admin/cuenta");
    expect(screen.getByRole("menuitem", { name: /Ver el sitio/ })).toHaveAttribute("href", "/");
    expect(screen.getByRole("menuitem", { name: /Cerrar sesión/ })).toBeInTheDocument();
  });
});

describe("Botón Crear", () => {
  it("lista lo que la persona puede crear", async () => {
    render(<CreateMenu items={CREATE} />);
    await userEvent.click(screen.getByRole("button", { name: "Crear" }));
    expect(await screen.findByRole("menuitem", { name: /Publicación/ })).toHaveAttribute("href", "/admin/publicaciones/nuevo");
  });

  it("sin nada que crear no se muestra", () => {
    const { container } = render(<CreateMenu items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Menú lateral", () => {
  it("se pliega a solo íconos y lo recuerda (cookie: el servidor lo dibuja ya plegado)", async () => {
    // El grupo de la página actual empieza abierto (acordeón: el resto, plegado).
    vi.mocked(usePathname).mockReturnValue("/admin/publicaciones");
    window.history.pushState({}, "", "/admin/publicaciones"); // la cookie es solo de /admin
    const { unmount } = render(<Sidebar siteName="Ecos del Camino" groups={GROUPS} initialCollapsed={false} />);
    const nav = screen.getByRole("navigation", { name: "Menú del panel" });
    expect(within(nav).getByRole("link", { name: "Publicaciones" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Plegar menú" }));
    expect(screen.getByRole("button", { name: "Desplegar menú" })).toHaveAttribute("aria-expanded", "false");
    // Plegado, cada ítem sigue teniendo nombre (lectores de pantalla y tooltip).
    expect(within(nav).getByRole("link", { name: "Publicaciones" })).toBeInTheDocument();
    expect(document.cookie).toContain(`${SIDEBAR_COOKIE}=collapsed`);
    unmount();
    render(<Sidebar siteName="Ecos del Camino" groups={GROUPS} initialCollapsed />);
    expect(screen.getByRole("button", { name: "Desplegar menú" })).toBeInTheDocument();
  });
});

describe("Barra del celular", () => {
  it("4 acciones con nombre, la actual marcada; Buscar abre la paleta", async () => {
    vi.mocked(usePathname).mockReturnValue("/admin/publicaciones/123");
    const { container } = render(
      <CommandPaletteProvider navItems={[{ href: "/admin", label: "Inicio" }]} createItems={CREATE}>
        <MobileTabBar groups={GROUPS} createItems={CREATE} />
      </CommandPaletteProvider>,
    );
    const bar = screen.getByRole("navigation", { name: "Accesos rápidos" });
    const names = within(bar)
      .getAllByRole("link")
      .concat(within(bar).getAllByRole("button"))
      .map((el) => el.textContent?.trim());
    expect(names).toEqual(expect.arrayContaining(["Inicio", "Publicaciones", "Crear", "Buscar", "Menú"]));
    expect(within(bar).getByRole("link", { name: "Publicaciones" })).toHaveAttribute("aria-current", "page");
    await userEvent.click(within(bar).getByRole("button", { name: "Buscar" }));
    expect(await screen.findByRole("dialog", { name: "Buscar o ir a" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("«Menú» abre el cajón con todas las secciones abiertas (sin vacíos)", async () => {
    vi.mocked(usePathname).mockReturnValue("/admin");
    render(
      <CommandPaletteProvider navItems={[]} createItems={[]}>
        <MobileTabBar groups={GROUPS} createItems={CREATE} />
      </CommandPaletteProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Menú" }));
    const drawer = await screen.findByRole("dialog", { name: "Menú del panel" });
    expect(within(drawer).getByRole("link", { name: "Publicaciones" })).toBeInTheDocument();
  });
});

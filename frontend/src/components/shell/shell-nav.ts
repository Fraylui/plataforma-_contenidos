import { CalendarBlank, Compass, House, MagnifyingGlass, type Icon } from "@phosphor-icons/react";

/**
 * Navegación principal del sitio público (diseño 2026-10-06, estilo app):
 * la misma en la barra inferior (celular) y en el riel izquierdo
 * (escritorio). Las secciones por tipo (Lugares, Galerías…) no van acá:
 * son filtros del feed (chips), como en Instagram.
 */
export type ShellTab = "inicio" | "explorar" | "buscar" | "agenda";

export interface ShellNavItem {
  tab: ShellTab;
  href: string;
  label: string;
  icon: Icon;
}

export const SHELL_NAV: ShellNavItem[] = [
  { tab: "inicio", href: "/", label: "Inicio", icon: House },
  { tab: "explorar", href: "/explorar", label: "Explorar", icon: Compass },
  { tab: "buscar", href: "/buscar", label: "Buscar", icon: MagnifyingGlass },
  { tab: "agenda", href: "/eventos", label: "Agenda", icon: CalendarBlank },
];

/** Enlaces de la hoja "Más" (celular) y del pie del riel (escritorio). */
export const MORE_LINKS: { href: string; label: string }[] = [
  { href: "/contacto", label: "Contacto" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/terminos", label: "Términos" },
];

/**
 * Pestaña activa para una ruta. Los listados por tipo, los temas y los
 * detalles (salvo eventos) son parte del feed: quedan en "Inicio".
 */
export function activeTab(pathname: string): ShellTab {
  if (pathname === "/eventos" || pathname.startsWith("/eventos/")) return "agenda";
  if (pathname === "/explorar" || pathname.startsWith("/explorar/")) return "explorar";
  if (pathname === "/buscar" || pathname.startsWith("/buscar/")) return "buscar";
  return "inicio";
}

export function visibleNav(showAgenda: boolean): ShellNavItem[] {
  return SHELL_NAV.filter((item) => item.tab !== "agenda" || showAgenda);
}

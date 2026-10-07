import type { Icon } from "@phosphor-icons/react";
import { ChartBar, Buildings, CalendarDots, Article, TreeStructure, House, Image as ImageIcon, Images, MapPin, Megaphone, GearSix, ShieldCheck, Storefront, UserCircle, Users } from "@phosphor-icons/react/dist/ssr";
import type { AdminUser, Module } from "@/lib/api/admin-types";
import { canAccess, isOwner } from "./permissions";

export type AdminNavGroup = "principal" | "contenido" | "publicidad" | "equipo";

export interface AdminNavItem {
  href: string;
  label: string;
  group: AdminNavGroup;
  icon: Icon;
  /** Módulo que exige (ver @RequiresModule en el backend). Sin módulo ni ownerOnly → cualquier usuario del panel. */
  module?: Module;
  /** Solo el dueño (OwnerOnlyPaths en el backend). */
  ownerOnly?: true;
}

export const ADMIN_NAV_GROUP_LABELS: Record<AdminNavGroup, string | null> = {
  principal: null,
  contenido: "Contenido",
  publicidad: "Publicidad",
  equipo: "Equipo y ajustes",
};

// Menú del panel con lenguaje de plataforma de contenido (2026-10-06): sin
// términos de redacción ("Medios", "Monetización", "Administración").
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Inicio", group: "principal", icon: House },
  {
    href: "/admin/estadisticas",
    label: "Estadísticas",
    group: "principal",
    icon: ChartBar,
    module: "STATS",
  },
  {
    href: "/admin/publicaciones",
    label: "Publicaciones",
    group: "contenido",
    icon: Article,
    module: "ARTICLES",
  },
  {
    href: "/admin/lugares",
    label: "Lugares",
    group: "contenido",
    icon: MapPin,
    module: "PLACES",
  },
  {
    href: "/admin/eventos",
    label: "Eventos",
    group: "contenido",
    icon: CalendarDots,
    module: "EVENTS",
  },
  {
    href: "/admin/galerias",
    label: "Galerías",
    group: "contenido",
    icon: Images,
    module: "GALLERIES",
  },
  {
    href: "/admin/directorio",
    label: "Directorio",
    group: "contenido",
    icon: Storefront,
    module: "DIRECTORY",
  },
  {
    href: "/admin/temas",
    label: "Temas",
    group: "contenido",
    icon: TreeStructure,
    module: "CATEGORIES",
  },
  {
    href: "/admin/imagenes",
    label: "Imágenes",
    group: "contenido",
    icon: ImageIcon,
  },
  {
    href: "/admin/trabajadores",
    label: "Trabajadores",
    group: "equipo",
    icon: Users,
    ownerOnly: true,
  },
  {
    href: "/admin/configuracion",
    label: "Configuración",
    group: "equipo",
    icon: GearSix,
    ownerOnly: true,
  },
  {
    href: "/admin/espacios",
    label: "Espacios publicitarios",
    group: "publicidad",
    icon: Megaphone,
    module: "ADVERTISING",
  },
  {
    href: "/admin/anunciantes",
    label: "Anunciantes",
    group: "publicidad",
    icon: Buildings,
    module: "ADVERTISING",
  },
  {
    href: "/admin/actividad",
    label: "Registro de actividad",
    group: "equipo",
    icon: ShieldCheck,
    ownerOnly: true,
  },
  { href: "/admin/cuenta", label: "Mi cuenta", group: "equipo", icon: UserCircle },
];

export function visibleNavItems(user: AdminUser): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) =>
    item.ownerOnly ? isOwner(user) : item.module ? canAccess(user, item.module) : true,
  );
}

export function groupedNavItems(user: AdminUser): Array<{ group: AdminNavGroup; items: AdminNavItem[] }> {
  const items = visibleNavItems(user);
  const groups: AdminNavGroup[] = ["principal", "contenido", "publicidad", "equipo"];
  return groups
    .map((group) => ({ group, items: items.filter((item) => item.group === group) }))
    .filter((entry) => entry.items.length > 0);
}

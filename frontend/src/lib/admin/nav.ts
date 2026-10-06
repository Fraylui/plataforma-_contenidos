import {
  BarChart3,
  Building2,
  CalendarDays,
  FileText,
  FolderTree,
  Home,
  Image as ImageIcon,
  Images,
  MapPin,
  Megaphone,
  Settings,
  ShieldCheck,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/api/admin-types";

export type AdminNavGroup = "principal" | "contenido" | "publicidad" | "equipo";

export interface AdminNavItem {
  href: string;
  label: string;
  group: AdminNavGroup;
  icon: LucideIcon;
  /** Sin restricción -> visible para cualquier usuario autenticado. */
  roles?: Role[];
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
  { href: "/admin", label: "Inicio", group: "principal", icon: Home },
  {
    href: "/admin/estadisticas",
    label: "Estadísticas",
    group: "principal",
    icon: BarChart3,
    // Debe coincidir con SecurityConfig: /api/v1/admin/stats/** -> SUPER_ADMIN, ADMIN, EDITOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  },
  {
    href: "/admin/publicaciones",
    label: "Publicaciones",
    group: "contenido",
    icon: FileText,
    // Debe coincidir con SecurityConfig: /api/v1/admin/articles/** -> SUPER_ADMIN, ADMIN, EDITOR, AUTHOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    href: "/admin/lugares",
    label: "Lugares",
    group: "contenido",
    icon: MapPin,
    // Debe coincidir con SecurityConfig: /api/v1/admin/places/** -> SUPER_ADMIN, ADMIN, EDITOR, AUTHOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    href: "/admin/eventos",
    label: "Eventos",
    group: "contenido",
    icon: CalendarDays,
    // Debe coincidir con SecurityConfig: /api/v1/admin/events/** -> SUPER_ADMIN, ADMIN, EDITOR, AUTHOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    href: "/admin/galerias",
    label: "Galerías",
    group: "contenido",
    icon: Images,
    // Debe coincidir con SecurityConfig: /api/v1/admin/galleries/** -> SUPER_ADMIN, ADMIN, EDITOR, AUTHOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    href: "/admin/directorio",
    label: "Directorio",
    group: "contenido",
    icon: Store,
    // Debe coincidir con SecurityConfig: /api/v1/admin/directory/** -> SUPER_ADMIN, ADMIN, EDITOR, AUTHOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    href: "/admin/temas",
    label: "Temas",
    group: "contenido",
    icon: FolderTree,
    // Debe coincidir con SecurityConfig: /api/v1/admin/categories/** -> SUPER_ADMIN, ADMIN, EDITOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  },
  {
    href: "/admin/imagenes",
    label: "Imágenes",
    group: "contenido",
    icon: ImageIcon,
    // Debe coincidir con SecurityConfig: /api/v1/admin/images/** -> SUPER_ADMIN, ADMIN, EDITOR, AUTHOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    group: "equipo",
    icon: Users,
    // Debe coincidir con SecurityConfig: /api/v1/admin/users/** -> SUPER_ADMIN, ADMIN.
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    href: "/admin/configuracion",
    label: "Configuración",
    group: "equipo",
    icon: Settings,
    // Debe coincidir con SecurityConfig: /api/v1/admin/platform-settings/** -> SUPER_ADMIN, ADMIN.
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    href: "/admin/espacios",
    label: "Espacios publicitarios",
    group: "publicidad",
    icon: Megaphone,
    // Debe coincidir con SecurityConfig: /api/v1/admin/ad-placements/** -> SUPER_ADMIN, ADMIN.
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    href: "/admin/anunciantes",
    label: "Anunciantes",
    group: "publicidad",
    icon: Building2,
    // Debe coincidir con SecurityConfig: /api/v1/admin/advertisers/**, /api/v1/admin/campaigns/** -> SUPER_ADMIN, ADMIN.
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    href: "/admin/actividad",
    label: "Registro de actividad",
    group: "equipo",
    icon: ShieldCheck,
    // Debe coincidir con SecurityConfig: /api/v1/admin/audit/** -> SUPER_ADMIN, ADMIN.
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
];

export function visibleNavItems(role: Role): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}

export function groupedNavItems(role: Role): Array<{ group: AdminNavGroup; items: AdminNavItem[] }> {
  const items = visibleNavItems(role);
  const groups: AdminNavGroup[] = ["principal", "contenido", "publicidad", "equipo"];
  return groups
    .map((group) => ({ group, items: items.filter((item) => item.group === group) }))
    .filter((entry) => entry.items.length > 0);
}

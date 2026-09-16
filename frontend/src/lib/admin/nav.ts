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

export type AdminNavGroup = "principal" | "contenido" | "organizacion" | "monetizacion" | "cuenta";

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
  organizacion: "Organización",
  monetizacion: "Monetización",
  cuenta: "Administración",
};

// Se agregan ítems aquí a medida que se implementa cada sección del CMS
// (CONTEXTO.md sección 11): artículos, categorías, medios, usuarios. De
// momento solo existen las páginas del "cimiento".
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
    href: "/admin/categorias",
    label: "Categorías",
    group: "organizacion",
    icon: FolderTree,
    // Debe coincidir con SecurityConfig: /api/v1/admin/categories/** -> SUPER_ADMIN, ADMIN, EDITOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  },
  {
    href: "/admin/medios",
    label: "Medios",
    group: "organizacion",
    icon: ImageIcon,
    // Debe coincidir con SecurityConfig: /api/v1/admin/images/** -> SUPER_ADMIN, ADMIN, EDITOR, AUTHOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    group: "cuenta",
    icon: Users,
    // Debe coincidir con SecurityConfig: /api/v1/admin/users/** -> SUPER_ADMIN, ADMIN.
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    href: "/admin/configuracion",
    label: "Configuración",
    group: "cuenta",
    icon: Settings,
    // Debe coincidir con SecurityConfig: /api/v1/admin/platform-settings/** -> SUPER_ADMIN, ADMIN.
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    href: "/admin/publicidad",
    label: "Publicidad",
    group: "monetizacion",
    icon: Megaphone,
    // Debe coincidir con SecurityConfig: /api/v1/admin/ad-placements/** -> SUPER_ADMIN, ADMIN.
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    href: "/admin/anunciantes",
    label: "Anunciantes",
    group: "monetizacion",
    icon: Building2,
    // Debe coincidir con SecurityConfig: /api/v1/admin/advertisers/**, /api/v1/admin/campaigns/** -> SUPER_ADMIN, ADMIN.
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    href: "/admin/auditoria",
    label: "Auditoría",
    group: "cuenta",
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
  const groups: AdminNavGroup[] = ["principal", "contenido", "organizacion", "monetizacion", "cuenta"];
  return groups
    .map((group) => ({ group, items: items.filter((item) => item.group === group) }))
    .filter((entry) => entry.items.length > 0);
}

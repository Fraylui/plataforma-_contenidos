import type { Role } from "@/lib/api/admin-types";

export type AdminNavGroup = "principal" | "contenido" | "organizacion" | "cuenta";

export interface AdminNavItem {
  href: string;
  label: string;
  group: AdminNavGroup;
  /** Sin restricción -> visible para cualquier usuario autenticado. */
  roles?: Role[];
}

export const ADMIN_NAV_GROUP_LABELS: Record<AdminNavGroup, string | null> = {
  principal: null,
  contenido: "Contenido",
  organizacion: "Organización",
  cuenta: "Cuenta",
};

// Se agregan ítems aquí a medida que se implementa cada sección del CMS
// (CONTEXTO.md sección 11): artículos, categorías, etiquetas, geografía,
// medios, usuarios. De momento solo existen las páginas del "cimiento".
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Inicio", group: "principal" },
  {
    href: "/admin/estadisticas",
    label: "Estadísticas",
    group: "principal",
    // Debe coincidir con SecurityConfig: /api/v1/admin/stats/** -> SUPER_ADMIN, ADMIN, EDITOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  },
  {
    href: "/admin/articulos",
    label: "Artículos",
    group: "contenido",
    // Debe coincidir con SecurityConfig: /api/v1/admin/articles/** -> SUPER_ADMIN, ADMIN, EDITOR, AUTHOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    href: "/admin/lugares",
    label: "Lugares",
    group: "contenido",
    // Debe coincidir con SecurityConfig: /api/v1/admin/places/** -> SUPER_ADMIN, ADMIN, EDITOR, AUTHOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    href: "/admin/eventos",
    label: "Eventos",
    group: "contenido",
    // Debe coincidir con SecurityConfig: /api/v1/admin/events/** -> SUPER_ADMIN, ADMIN, EDITOR, AUTHOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    href: "/admin/galerias",
    label: "Galerías",
    group: "contenido",
    // Debe coincidir con SecurityConfig: /api/v1/admin/galleries/** -> SUPER_ADMIN, ADMIN, EDITOR, AUTHOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    href: "/admin/resenas",
    label: "Reseñas",
    group: "contenido",
    // Debe coincidir con SecurityConfig: /api/v1/admin/reviews/** -> SUPER_ADMIN, ADMIN, EDITOR, AUTHOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    href: "/admin/directorio",
    label: "Directorio",
    group: "contenido",
    // Debe coincidir con SecurityConfig: /api/v1/admin/directory/** -> SUPER_ADMIN, ADMIN, EDITOR, AUTHOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    href: "/admin/categorias",
    label: "Categorías",
    group: "organizacion",
    // Debe coincidir con SecurityConfig: /api/v1/admin/categories/** -> SUPER_ADMIN, ADMIN, EDITOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  },
  {
    href: "/admin/etiquetas",
    label: "Etiquetas",
    group: "organizacion",
    // Debe coincidir con SecurityConfig: /api/v1/admin/tags/** -> SUPER_ADMIN, ADMIN, EDITOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  },
  {
    href: "/admin/geografia",
    label: "Geografía",
    group: "organizacion",
    // Debe coincidir con SecurityConfig: /api/v1/admin/geography/** -> SUPER_ADMIN, ADMIN, EDITOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  },
  {
    href: "/admin/medios",
    label: "Medios",
    group: "organizacion",
    // Debe coincidir con SecurityConfig: /api/v1/admin/images/** -> SUPER_ADMIN, ADMIN, EDITOR, AUTHOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    group: "cuenta",
    // Debe coincidir con SecurityConfig: /api/v1/admin/users/** -> SUPER_ADMIN, ADMIN.
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  { href: "/admin/mfa-setup", label: "Seguridad (MFA)", group: "cuenta" },
  {
    href: "/admin/configuracion",
    label: "Configuración",
    group: "cuenta",
    // Debe coincidir con SecurityConfig: /api/v1/admin/platform-settings/** -> SUPER_ADMIN, ADMIN.
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    href: "/admin/auditoria",
    label: "Auditoría",
    group: "cuenta",
    // Debe coincidir con SecurityConfig: /api/v1/admin/audit/** -> SUPER_ADMIN, ADMIN.
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
];

export function visibleNavItems(role: Role): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}

export function groupedNavItems(role: Role): Array<{ group: AdminNavGroup; items: AdminNavItem[] }> {
  const items = visibleNavItems(role);
  const groups: AdminNavGroup[] = ["principal", "contenido", "organizacion", "cuenta"];
  return groups
    .map((group) => ({ group, items: items.filter((item) => item.group === group) }))
    .filter((entry) => entry.items.length > 0);
}

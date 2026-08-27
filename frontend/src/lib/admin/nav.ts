import type { Role } from "@/lib/api/admin-types";

export interface AdminNavItem {
  href: string;
  label: string;
  /** Sin restricción -> visible para cualquier usuario autenticado. */
  roles?: Role[];
}

// Se agregan ítems aquí a medida que se implementa cada sección del CMS
// (CONTEXTO.md sección 11): artículos, categorías, etiquetas, geografía,
// medios, usuarios. De momento solo existen las páginas del "cimiento".
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Inicio" },
  {
    href: "/admin/estadisticas",
    label: "Estadísticas",
    // Debe coincidir con SecurityConfig: /api/v1/admin/stats/** -> SUPER_ADMIN, ADMIN, EDITOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  },
  {
    href: "/admin/articulos",
    label: "Artículos",
    // Debe coincidir con SecurityConfig: /api/v1/admin/articles/** -> SUPER_ADMIN, ADMIN, EDITOR, AUTHOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    href: "/admin/lugares",
    label: "Lugares",
    // Debe coincidir con SecurityConfig: /api/v1/admin/places/** -> SUPER_ADMIN, ADMIN, EDITOR, AUTHOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    href: "/admin/categorias",
    label: "Categorías",
    // Debe coincidir con SecurityConfig: /api/v1/admin/categories/** -> SUPER_ADMIN, ADMIN, EDITOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  },
  {
    href: "/admin/etiquetas",
    label: "Etiquetas",
    // Debe coincidir con SecurityConfig: /api/v1/admin/tags/** -> SUPER_ADMIN, ADMIN, EDITOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  },
  {
    href: "/admin/geografia",
    label: "Geografía",
    // Debe coincidir con SecurityConfig: /api/v1/admin/geography/** -> SUPER_ADMIN, ADMIN, EDITOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  },
  {
    href: "/admin/medios",
    label: "Medios",
    // Debe coincidir con SecurityConfig: /api/v1/admin/images/** -> SUPER_ADMIN, ADMIN, EDITOR, AUTHOR.
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    // Debe coincidir con SecurityConfig: /api/v1/admin/users/** -> SUPER_ADMIN, ADMIN.
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  { href: "/admin/mfa-setup", label: "Seguridad (MFA)" },
  {
    href: "/admin/configuracion",
    label: "Configuración",
    // Debe coincidir con SecurityConfig: /api/v1/admin/platform-settings/** -> SUPER_ADMIN, ADMIN.
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
];

export function visibleNavItems(role: Role): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}

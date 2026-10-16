import type { AdminUser, Module } from "@/lib/api/admin-types";

/**
 * Espejo de Permissions.java para decidir qué mostrar en el panel (menú,
 * botones). Tener un módulo de contenido es publicar en él, sin paso de
 * aprobación. El servidor es la autoridad: rechaza con 403 lo que no
 * corresponda aunque la UI lo mostrara.
 */
export function isOwner(user: AdminUser): boolean {
  return user.role === "OWNER";
}

export function canAccess(user: AdminUser, module: Module): boolean {
  return isOwner(user) || user.permissions[module] !== undefined;
}

const CONTENT_MODULES: Module[] = ["PUBLICATIONS", "PLACES", "EVENTS", "GALLERIES", "DIRECTORY", "SERIES"];

/** Imágenes: editar o borrar las de otros exige algún módulo de contenido. */
export function hasAnyContentModule(user: AdminUser): boolean {
  return CONTENT_MODULES.some((module) => canAccess(user, module));
}

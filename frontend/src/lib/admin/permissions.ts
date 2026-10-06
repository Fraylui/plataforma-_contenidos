import type { AdminUser, Module } from "@/lib/api/admin-types";

/**
 * Espejo de Permissions.java para decidir qué mostrar en el panel (menú,
 * botones de aprobar/publicar). El servidor es la autoridad: rechaza con
 * 403 lo que no corresponda aunque la UI lo mostrara.
 */
export function isOwner(user: AdminUser): boolean {
  return user.role === "OWNER";
}

export function canAccess(user: AdminUser, module: Module): boolean {
  return isOwner(user) || user.permissions[module] !== undefined;
}

export function canPublish(user: AdminUser, module: Module): boolean {
  return isOwner(user) || user.permissions[module] === "PUBLISH";
}

const CONTENT_MODULES: Module[] = ["ARTICLES", "PLACES", "EVENTS", "GALLERIES", "DIRECTORY"];

/** Imágenes: editar o borrar las de otros exige publicar en algún módulo de contenido. */
export function canPublishAnyContent(user: AdminUser): boolean {
  return CONTENT_MODULES.some((module) => canPublish(user, module));
}

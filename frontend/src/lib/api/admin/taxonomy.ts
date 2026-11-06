// Temas (CategoryController, rutas /admin/categories).
import "server-only";
import type { AdminCategory, CategoryCreateInput, CategoryUpdateInput } from "../admin-types";
import type { Category } from "../types";
import { AdminApiError, BACKEND_API_URL, authedJson, parseErrorMessage } from "./http";

export function listAdminCategories(accessToken: string): Promise<AdminCategory[]> {
  return authedJson("/api/v1/admin/categories", accessToken);
}

/**
 * GET /categories (activas, público) sin caché — para selectores dentro de
 * formularios del panel (ej. tema de una publicación). A diferencia de
 * listActiveCategories() en src/lib/api/client.ts (sitio público, cacheada
 * 300s), acá una categoría recién creada debe poder elegirse de inmediato;
 * además quien solo crea no tiene el módulo Temas, así
 * que no puede usarse listAdminCategories() para el compositor.
 */
export async function listActiveCategoriesFresh(): Promise<Category[]> {
  const res = await fetch(`${BACKEND_API_URL}/api/v1/categories`, { cache: "no-store" });
  if (!res.ok) {
    throw new AdminApiError(res.status, await parseErrorMessage(res));
  }
  return res.json() as Promise<Category[]>;
}

export function createCategory(accessToken: string, input: CategoryCreateInput): Promise<Category> {
  return authedJson("/api/v1/admin/categories", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateCategory(accessToken: string, id: string, input: CategoryUpdateInput): Promise<Category> {
  return authedJson(`/api/v1/admin/categories/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function activateCategory(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/categories/${encodeURIComponent(id)}/activate`, accessToken, { method: "POST" });
}

export function deactivateCategory(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/categories/${encodeURIComponent(id)}`, accessToken, { method: "DELETE" });
}

// Cliente del backend para el panel administrativo. A diferencia de
// src/lib/api/client.ts (público, cacheado), estas llamadas nunca se cachean
// (datos privados, mutables) y casi todas requieren Authorization: Bearer.
// Solo se invoca desde el servidor de Next.js (Server Actions, Server
// Components, proxy.ts) — ver src/lib/admin/session.ts para el porqué.
import "server-only";
import type {
  AdminImage,
  AdminUser,
  ArticleInput,
  CategoryCreateInput,
  CategoryUpdateInput,
  CreateUserInput,
  GeographyCreateInput,
  MfaBackupCodes,
  MfaEnrollment,
  TokenResponse,
} from "./admin-types";
import type { Article, Category, GeographicUnit, Tag } from "./types";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";

/** Error del backend con status HTTP y mensaje ya extraídos, para que la UI decida qué mostrar. */
export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** El access token dejó de ser válido (expiró o fue revocado): quien llama debe redirigir a login. */
export class AdminSessionExpiredError extends Error {}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string };
    return body.message ?? `Error del backend (${res.status})`;
  } catch {
    return `Error del backend (${res.status})`;
  }
}

async function publicJson<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_API_URL}${path}`, { ...init, cache: "no-store" });
  if (!res.ok) {
    throw new AdminApiError(res.status, await parseErrorMessage(res));
  }
  return res.json() as Promise<T>;
}

export function login(email: string, password: string, mfaCode?: string): Promise<TokenResponse> {
  return publicJson("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, mfaCode: mfaCode || undefined }),
  });
}

export function refreshSession(refreshToken: string): Promise<TokenResponse> {
  return publicJson("/api/v1/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logoutSession(refreshToken: string): Promise<void> {
  // Best-effort: si el refresh token ya no es válido no hay nada que revocar.
  await fetch(`${BACKEND_API_URL}/api/v1/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  }).catch(() => undefined);
}

/** Llamada autenticada genérica. Traduce un 401 del backend en AdminSessionExpiredError. */
async function authedJson<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (res.status === 401) {
    throw new AdminSessionExpiredError();
  }
  if (!res.ok) {
    throw new AdminApiError(res.status, await parseErrorMessage(res));
  }
  // Varios endpoints admin devuelven `void` sin @ResponseStatus explícito
  // (ej. activate/deactivate/delete de categorías, geografía, tags): Spring
  // los sirve como 200 con cuerpo vacío, no 204 — probar 204 solo no alcanza.
  const text = await res.text();
  if (text.length === 0) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export function getCurrentUser(accessToken: string): Promise<AdminUser> {
  return authedJson("/api/v1/users/me", accessToken);
}

export function enrollMfa(accessToken: string): Promise<MfaEnrollment> {
  return authedJson("/api/v1/users/me/mfa/enroll", accessToken, { method: "POST" });
}

export function confirmMfa(accessToken: string, code: string): Promise<MfaBackupCodes> {
  return authedJson("/api/v1/users/me/mfa/confirm", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
}

// --- Content module: artículos (ArticleAdminController) ---

export function listAdminArticles(accessToken: string): Promise<Article[]> {
  return authedJson("/api/v1/admin/articles", accessToken);
}

export function getAdminArticle(accessToken: string, id: string): Promise<Article> {
  return authedJson(`/api/v1/admin/articles/${encodeURIComponent(id)}`, accessToken);
}

export function createArticle(accessToken: string, input: ArticleInput): Promise<Article> {
  return authedJson("/api/v1/admin/articles", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateArticle(accessToken: string, id: string, input: ArticleInput): Promise<Article> {
  return authedJson(`/api/v1/admin/articles/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function submitArticle(accessToken: string, id: string): Promise<Article> {
  return authedJson(`/api/v1/admin/articles/${encodeURIComponent(id)}/submit`, accessToken, { method: "POST" });
}

export function approveArticle(accessToken: string, id: string): Promise<Article> {
  return authedJson(`/api/v1/admin/articles/${encodeURIComponent(id)}/approve`, accessToken, { method: "POST" });
}

export function rejectArticle(accessToken: string, id: string, reason: string): Promise<Article> {
  return authedJson(`/api/v1/admin/articles/${encodeURIComponent(id)}/reject`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}

export function publishArticle(accessToken: string, id: string): Promise<Article> {
  return authedJson(`/api/v1/admin/articles/${encodeURIComponent(id)}/publish`, accessToken, { method: "POST" });
}

export function scheduleArticle(accessToken: string, id: string, scheduledAt: string): Promise<Article> {
  return authedJson(`/api/v1/admin/articles/${encodeURIComponent(id)}/schedule`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduledAt }),
  });
}

export function archiveArticle(accessToken: string, id: string): Promise<Article> {
  return authedJson(`/api/v1/admin/articles/${encodeURIComponent(id)}/archive`, accessToken, { method: "POST" });
}

// --- Taxonomy module: categorías (CategoryController, rutas /admin/categories) ---

export function listAdminCategories(accessToken: string): Promise<Category[]> {
  return authedJson("/api/v1/admin/categories", accessToken);
}

/**
 * GET /categories (activas, público) sin caché — para selectores dentro de
 * formularios admin (ej. categoría de un artículo). A diferencia de
 * listActiveCategories() en src/lib/api/client.ts (sitio público, cacheada
 * 300s), acá una categoría recién creada debe poder elegirse de inmediato;
 * además AUTHOR no tiene acceso a /admin/categories (SecurityConfig), así
 * que no puede usarse listAdminCategories() para el formulario de artículo.
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

// --- Taxonomy module: etiquetas (TagController) ---
// No hay creación admin: TagService.getOrCreate las crea implícitamente al
// guardar un artículo con tagNames nuevos (ver ArticleService).

/**
 * GET /tags es público (no requiere token), pero para el panel admin se
 * pide siempre sin caché: a diferencia de src/lib/api/client.ts (sitio
 * público, cacheado 300s), acá un delete debe reflejarse de inmediato — y
 * revalidatePath() no alcanza a invalidar la entrada de caché de fetch()
 * que ya tenga esa función pública.
 */
export async function listAdminTags(): Promise<Tag[]> {
  const res = await fetch(`${BACKEND_API_URL}/api/v1/tags`, { cache: "no-store" });
  if (!res.ok) {
    throw new AdminApiError(res.status, await parseErrorMessage(res));
  }
  return res.json() as Promise<Tag[]>;
}

export function deleteTag(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/tags/${encodeURIComponent(id)}`, accessToken, { method: "DELETE" });
}

// --- Geography module (GeographyController, rutas /admin/geography) ---
// Jerarquía fija PAIS→REGION→PROVINCIA→DISTRITO→LOCALIDAD (CONTEXTO.md
// sección 5): a diferencia de categorías, una unidad no se puede
// "reparentar" ni cambiar de nivel una vez creada — GeographicUnitService
// solo expone rename() para el nombre.

export function listAdminGeography(accessToken: string): Promise<GeographicUnit[]> {
  return authedJson("/api/v1/admin/geography", accessToken);
}

export function createGeography(accessToken: string, input: GeographyCreateInput): Promise<GeographicUnit> {
  return authedJson("/api/v1/admin/geography", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function renameGeography(accessToken: string, id: string, name: string): Promise<GeographicUnit> {
  return authedJson(`/api/v1/admin/geography/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function activateGeography(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/geography/${encodeURIComponent(id)}/activate`, accessToken, { method: "POST" });
}

export function deactivateGeography(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/geography/${encodeURIComponent(id)}`, accessToken, { method: "DELETE" });
}

// --- Media module: imágenes (ImageAdminController) ---

export function listAdminImages(accessToken: string): Promise<AdminImage[]> {
  return authedJson("/api/v1/admin/images", accessToken);
}

/**
 * `formData` debe traer un part "file" (el binario) y opcionalmente
 * "altText". No se fija Content-Type a mano: fetch genera el boundary
 * multipart correcto solo si se lo deja decidir a él.
 */
export function uploadImage(accessToken: string, formData: FormData): Promise<AdminImage> {
  return authedJson("/api/v1/admin/images", accessToken, {
    method: "POST",
    body: formData,
  });
}

export function updateImageAltText(accessToken: string, id: string, altText: string): Promise<AdminImage> {
  return authedJson(`/api/v1/admin/images/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ altText }),
  });
}

export function deleteImage(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/images/${encodeURIComponent(id)}`, accessToken, { method: "DELETE" });
}

// --- Identity module: usuarios (UserAdminController) ---

export function listAdminUsers(accessToken: string): Promise<AdminUser[]> {
  return authedJson("/api/v1/admin/users", accessToken);
}

export function createUser(accessToken: string, input: CreateUserInput): Promise<AdminUser> {
  return authedJson("/api/v1/admin/users", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function activateUser(accessToken: string, id: string): Promise<AdminUser> {
  return authedJson(`/api/v1/admin/users/${encodeURIComponent(id)}/activate`, accessToken, { method: "POST" });
}

export function deactivateUser(accessToken: string, id: string): Promise<AdminUser> {
  return authedJson(`/api/v1/admin/users/${encodeURIComponent(id)}`, accessToken, { method: "DELETE" });
}

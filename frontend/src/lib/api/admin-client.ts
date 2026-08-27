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
  AuditEvent,
  AuditSearchFilters,
  CategoryCreateInput,
  CategoryUpdateInput,
  CreateUserInput,
  EventInput,
  GalleryInput,
  GeographyCreateInput,
  MfaBackupCodes,
  MfaEnrollment,
  PlaceInput,
  PlatformSettingsInput,
  PlatformStats,
  ReviewInput,
  TokenResponse,
} from "./admin-types";
import type {
  Article,
  Category,
  Event,
  Gallery,
  GeographicUnit,
  PageResponse,
  Place,
  PlatformSettings,
  Review,
  Tag,
} from "./types";

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

// --- Places module: lugares (PlaceAdminController, rutas /admin/places) — CONTEXTO.md sección 6 ---

export function listAdminPlaces(accessToken: string): Promise<Place[]> {
  return authedJson("/api/v1/admin/places", accessToken);
}

export function getAdminPlace(accessToken: string, id: string): Promise<Place> {
  return authedJson(`/api/v1/admin/places/${encodeURIComponent(id)}`, accessToken);
}

export function createPlace(accessToken: string, input: PlaceInput): Promise<Place> {
  return authedJson("/api/v1/admin/places", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updatePlace(accessToken: string, id: string, input: PlaceInput): Promise<Place> {
  return authedJson(`/api/v1/admin/places/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function submitPlace(accessToken: string, id: string): Promise<Place> {
  return authedJson(`/api/v1/admin/places/${encodeURIComponent(id)}/submit`, accessToken, { method: "POST" });
}

export function approvePlace(accessToken: string, id: string): Promise<Place> {
  return authedJson(`/api/v1/admin/places/${encodeURIComponent(id)}/approve`, accessToken, { method: "POST" });
}

export function rejectPlace(accessToken: string, id: string, reason: string): Promise<Place> {
  return authedJson(`/api/v1/admin/places/${encodeURIComponent(id)}/reject`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}

export function publishPlace(accessToken: string, id: string): Promise<Place> {
  return authedJson(`/api/v1/admin/places/${encodeURIComponent(id)}/publish`, accessToken, { method: "POST" });
}

export function schedulePlace(accessToken: string, id: string, scheduledAt: string): Promise<Place> {
  return authedJson(`/api/v1/admin/places/${encodeURIComponent(id)}/schedule`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduledAt }),
  });
}

export function archivePlace(accessToken: string, id: string): Promise<Place> {
  return authedJson(`/api/v1/admin/places/${encodeURIComponent(id)}/archive`, accessToken, { method: "POST" });
}

// --- Events module: eventos (EventAdminController, rutas /admin/events) ---

export function listAdminEvents(accessToken: string): Promise<Event[]> {
  return authedJson("/api/v1/admin/events", accessToken);
}

export function getAdminEvent(accessToken: string, id: string): Promise<Event> {
  return authedJson(`/api/v1/admin/events/${encodeURIComponent(id)}`, accessToken);
}

export function createEvent(accessToken: string, input: EventInput): Promise<Event> {
  return authedJson("/api/v1/admin/events", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateEvent(accessToken: string, id: string, input: EventInput): Promise<Event> {
  return authedJson(`/api/v1/admin/events/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function submitEvent(accessToken: string, id: string): Promise<Event> {
  return authedJson(`/api/v1/admin/events/${encodeURIComponent(id)}/submit`, accessToken, { method: "POST" });
}

export function approveEvent(accessToken: string, id: string): Promise<Event> {
  return authedJson(`/api/v1/admin/events/${encodeURIComponent(id)}/approve`, accessToken, { method: "POST" });
}

export function rejectEvent(accessToken: string, id: string, reason: string): Promise<Event> {
  return authedJson(`/api/v1/admin/events/${encodeURIComponent(id)}/reject`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}

export function publishEvent(accessToken: string, id: string): Promise<Event> {
  return authedJson(`/api/v1/admin/events/${encodeURIComponent(id)}/publish`, accessToken, { method: "POST" });
}

export function scheduleEvent(accessToken: string, id: string, scheduledAt: string): Promise<Event> {
  return authedJson(`/api/v1/admin/events/${encodeURIComponent(id)}/schedule`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduledAt }),
  });
}

export function archiveEvent(accessToken: string, id: string): Promise<Event> {
  return authedJson(`/api/v1/admin/events/${encodeURIComponent(id)}/archive`, accessToken, { method: "POST" });
}

// --- Galleries module: galerías (GalleryAdminController, rutas /admin/galleries) ---

export function listAdminGalleries(accessToken: string): Promise<Gallery[]> {
  return authedJson("/api/v1/admin/galleries", accessToken);
}

export function getAdminGallery(accessToken: string, id: string): Promise<Gallery> {
  return authedJson(`/api/v1/admin/galleries/${encodeURIComponent(id)}`, accessToken);
}

export function createGallery(accessToken: string, input: GalleryInput): Promise<Gallery> {
  return authedJson("/api/v1/admin/galleries", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateGallery(accessToken: string, id: string, input: GalleryInput): Promise<Gallery> {
  return authedJson(`/api/v1/admin/galleries/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function submitGallery(accessToken: string, id: string): Promise<Gallery> {
  return authedJson(`/api/v1/admin/galleries/${encodeURIComponent(id)}/submit`, accessToken, { method: "POST" });
}

export function approveGallery(accessToken: string, id: string): Promise<Gallery> {
  return authedJson(`/api/v1/admin/galleries/${encodeURIComponent(id)}/approve`, accessToken, { method: "POST" });
}

export function rejectGallery(accessToken: string, id: string, reason: string): Promise<Gallery> {
  return authedJson(`/api/v1/admin/galleries/${encodeURIComponent(id)}/reject`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}

export function publishGallery(accessToken: string, id: string): Promise<Gallery> {
  return authedJson(`/api/v1/admin/galleries/${encodeURIComponent(id)}/publish`, accessToken, { method: "POST" });
}

export function scheduleGallery(accessToken: string, id: string, scheduledAt: string): Promise<Gallery> {
  return authedJson(`/api/v1/admin/galleries/${encodeURIComponent(id)}/schedule`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduledAt }),
  });
}

export function archiveGallery(accessToken: string, id: string): Promise<Gallery> {
  return authedJson(`/api/v1/admin/galleries/${encodeURIComponent(id)}/archive`, accessToken, { method: "POST" });
}

// --- Reviews module: reseñas (ReviewAdminController, rutas /admin/reviews) ---

export function listAdminReviews(accessToken: string): Promise<Review[]> {
  return authedJson("/api/v1/admin/reviews", accessToken);
}

export function getAdminReview(accessToken: string, id: string): Promise<Review> {
  return authedJson(`/api/v1/admin/reviews/${encodeURIComponent(id)}`, accessToken);
}

export function createReview(accessToken: string, input: ReviewInput): Promise<Review> {
  return authedJson("/api/v1/admin/reviews", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateReview(accessToken: string, id: string, input: ReviewInput): Promise<Review> {
  return authedJson(`/api/v1/admin/reviews/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function submitReview(accessToken: string, id: string): Promise<Review> {
  return authedJson(`/api/v1/admin/reviews/${encodeURIComponent(id)}/submit`, accessToken, { method: "POST" });
}

export function approveReview(accessToken: string, id: string): Promise<Review> {
  return authedJson(`/api/v1/admin/reviews/${encodeURIComponent(id)}/approve`, accessToken, { method: "POST" });
}

export function rejectReview(accessToken: string, id: string, reason: string): Promise<Review> {
  return authedJson(`/api/v1/admin/reviews/${encodeURIComponent(id)}/reject`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}

export function publishReview(accessToken: string, id: string): Promise<Review> {
  return authedJson(`/api/v1/admin/reviews/${encodeURIComponent(id)}/publish`, accessToken, { method: "POST" });
}

export function scheduleReview(accessToken: string, id: string, scheduledAt: string): Promise<Review> {
  return authedJson(`/api/v1/admin/reviews/${encodeURIComponent(id)}/schedule`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduledAt }),
  });
}

export function archiveReview(accessToken: string, id: string): Promise<Review> {
  return authedJson(`/api/v1/admin/reviews/${encodeURIComponent(id)}/archive`, accessToken, { method: "POST" });
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

// --- Configuration module: identidad de plataforma (PlatformSettingsAdminController) ---

export function getAdminPlatformSettings(accessToken: string): Promise<PlatformSettings> {
  return authedJson("/api/v1/admin/platform-settings", accessToken);
}

export function updatePlatformSettings(
  accessToken: string,
  input: PlatformSettingsInput,
): Promise<PlatformSettings> {
  return authedJson("/api/v1/admin/platform-settings", accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

// --- Stats module: estadísticas básicas (StatsController) ---

export function getAdminStats(accessToken: string): Promise<PlatformStats> {
  return authedJson("/api/v1/admin/stats", accessToken);
}

// --- Audit module: audit log (AuditController) ---

export function listAdminAuditLog(
  accessToken: string,
  filters: AuditSearchFilters,
): Promise<PageResponse<AuditEvent>> {
  const params = new URLSearchParams();
  if (filters.actorEmail) params.set("actorEmail", filters.actorEmail);
  if (filters.action) params.set("action", filters.action);
  if (filters.resourceType) params.set("resourceType", filters.resourceType);
  if (filters.result) params.set("result", filters.result);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  params.set("page", String(filters.page ?? 0));
  params.set("size", String(filters.size ?? 20));
  return authedJson(`/api/v1/admin/audit?${params.toString()}`, accessToken);
}

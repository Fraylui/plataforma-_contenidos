// Cliente del backend para el panel administrativo. A diferencia de
// src/lib/api/client.ts (público, cacheado), estas llamadas nunca se cachean
// (datos privados, mutables) y casi todas requieren Authorization: Bearer.
// Solo se invoca desde el servidor de Next.js (Server Actions, Server
// Components, proxy.ts) — ver src/lib/admin/session.ts para el porqué.
import "server-only";
import { headers } from "next/headers";
import type { PublicationKind, PublicationStep } from "@/lib/admin/publication";
import type {
  AdminImage,
  AdminUser,
  CreateWorkerInput,
  PlaceOption,
  ModulePermissions,
  Worker,
  AdPlacementCreateInput,
  AdPlacementUpdateInput,
  Advertiser,
  AdvertiserInput,
  ArticleInput,
  AuditEvent,
  AuditSearchFilters,
  BusinessInput,
  Campaign,
  CampaignDailyStat,
  CampaignInput,
  CategoryCreateInput,
  CategoryUpdateInput,
  EventInput,
  GalleryInput,
  PlaceInput,
  PlatformSettingsInput,
  PlatformStats,
  TokenResponse,
} from "./admin-types";
import type {
  AdPlacement,
  Article,
  Business,
  Category,
  Event,
  Gallery,
  PageResponse,
  Place,
  PlatformSettings,
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

const IP_PATTERN = /^[0-9a-fA-F:.]{3,45}$/;

/**
 * IP real del visitante para el backend. Las llamadas admin salen del
 * servidor de Next, así que sin esto Spring solo veía la IP del contenedor
 * del frontend: el límite de intentos de login (LoginRateLimiter, por IP)
 * era UN contador compartido por todo el mundo — 5 contraseñas falladas de
 * cualquiera bloqueaban el panel a todos 15 minutos — y la auditoría
 * registraba siempre la misma IP. nginx pone X-Real-IP (ya resuelta detrás
 * de Cloudflare, ver infra/nginx); Spring la toma de X-Forwarded-For porque
 * confía en proxies de la red interna (server.forward-headers-strategy).
 * Sin nginx delante (desarrollo local) no hay header y todo sigue como antes.
 */
async function clientIpHeaders(): Promise<Record<string, string>> {
  try {
    const ip = (await headers()).get("x-real-ip");
    return ip && IP_PATTERN.test(ip) ? { "X-Forwarded-For": ip } : {};
  } catch {
    // Fuera de un pedido (build, tareas de fondo): no hay visitante que identificar.
    return {};
  }
}

async function publicJson<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    headers: { ...(await clientIpHeaders()), ...init.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new AdminApiError(res.status, await parseErrorMessage(res));
  }
  return res.json() as Promise<T>;
}

export function login(email: string, password: string): Promise<TokenResponse> {
  return publicJson("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
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
    headers: { ...(await clientIpHeaders()), ...init?.headers, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (res.status === 401) {
    throw new AdminSessionExpiredError();
  }
  if (!res.ok) {
    throw new AdminApiError(res.status, await parseErrorMessage(res));
  }
  // Varios endpoints admin devuelven `void` sin @ResponseStatus explícito
  // (ej. activate/deactivate/delete de categorías): Spring los sirve como
  // 200 con cuerpo vacío, no 204 — probar 204 solo no alcanza.
  const text = await res.text();
  if (text.length === 0) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export function getCurrentUser(accessToken: string): Promise<AdminUser> {
  return authedJson("/api/v1/users/me", accessToken);
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

// --- Directory module: fichas de directorio (BusinessAdminController, rutas /admin/directory) ---

export function listAdminBusinesses(accessToken: string): Promise<Business[]> {
  return authedJson("/api/v1/admin/directory", accessToken);
}

export function getAdminBusiness(accessToken: string, id: string): Promise<Business> {
  return authedJson(`/api/v1/admin/directory/${encodeURIComponent(id)}`, accessToken);
}

export function createBusiness(accessToken: string, input: BusinessInput): Promise<Business> {
  return authedJson("/api/v1/admin/directory", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateBusiness(accessToken: string, id: string, input: BusinessInput): Promise<Business> {
  return authedJson(`/api/v1/admin/directory/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
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

// --- Advertising module: posiciones de anuncio (AdPlacementController, rutas /admin/ad-placements) ---

export function listAdminAdPlacements(accessToken: string): Promise<AdPlacement[]> {
  return authedJson("/api/v1/admin/ad-placements", accessToken);
}

export function getAdminAdPlacement(accessToken: string, id: string): Promise<AdPlacement> {
  return authedJson(`/api/v1/admin/ad-placements/${encodeURIComponent(id)}`, accessToken);
}

export function createAdPlacement(accessToken: string, input: AdPlacementCreateInput): Promise<AdPlacement> {
  return authedJson("/api/v1/admin/ad-placements", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateAdPlacement(
  accessToken: string,
  id: string,
  input: AdPlacementUpdateInput,
): Promise<AdPlacement> {
  return authedJson(`/api/v1/admin/ad-placements/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function activateAdPlacement(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/ad-placements/${encodeURIComponent(id)}/activate`, accessToken, {
    method: "POST",
  });
}

export function deactivateAdPlacement(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/ad-placements/${encodeURIComponent(id)}/deactivate`, accessToken, {
    method: "POST",
  });
}

export function deleteAdPlacement(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/ad-placements/${encodeURIComponent(id)}`, accessToken, { method: "DELETE" });
}

// --- Advertising module: anunciantes (AdvertiserAdminController, rutas /admin/advertisers) ---

export function listAdvertisers(accessToken: string): Promise<Advertiser[]> {
  return authedJson("/api/v1/admin/advertisers", accessToken);
}

export function getAdvertiser(accessToken: string, id: string): Promise<Advertiser> {
  return authedJson(`/api/v1/admin/advertisers/${encodeURIComponent(id)}`, accessToken);
}

export function createAdvertiser(accessToken: string, input: AdvertiserInput): Promise<Advertiser> {
  return authedJson("/api/v1/admin/advertisers", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateAdvertiser(accessToken: string, id: string, input: AdvertiserInput): Promise<Advertiser> {
  return authedJson(`/api/v1/admin/advertisers/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteAdvertiser(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/advertisers/${encodeURIComponent(id)}`, accessToken, { method: "DELETE" });
}

// --- Advertising module: campañas (CampaignAdminController, rutas /admin/campaigns) ---

export function listCampaigns(accessToken: string, advertiserId?: string): Promise<Campaign[]> {
  const query = advertiserId ? `?advertiserId=${encodeURIComponent(advertiserId)}` : "";
  return authedJson(`/api/v1/admin/campaigns${query}`, accessToken);
}

export function getCampaign(accessToken: string, id: string): Promise<Campaign> {
  return authedJson(`/api/v1/admin/campaigns/${encodeURIComponent(id)}`, accessToken);
}

/** Impresiones visibles y clics válidos por día (UTC) — ver CampaignAdminController.stats. */
export function getCampaignStats(accessToken: string, id: string, days = 30): Promise<CampaignDailyStat[]> {
  return authedJson(`/api/v1/admin/campaigns/${encodeURIComponent(id)}/stats?days=${days}`, accessToken);
}

export function createCampaign(accessToken: string, input: CampaignInput): Promise<Campaign> {
  return authedJson("/api/v1/admin/campaigns", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateCampaign(accessToken: string, id: string, input: CampaignInput): Promise<Campaign> {
  return authedJson(`/api/v1/admin/campaigns/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function activateCampaign(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/campaigns/${encodeURIComponent(id)}/activate`, accessToken, { method: "POST" });
}

export function deactivateCampaign(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/campaigns/${encodeURIComponent(id)}/deactivate`, accessToken, { method: "POST" });
}

export function deleteCampaign(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/campaigns/${encodeURIComponent(id)}`, accessToken, { method: "DELETE" });
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

// --- Trabajadores (solo el dueño; spec 2a §5) ---

export function listWorkers(accessToken: string): Promise<Worker[]> {
  return authedJson("/api/v1/admin/workers", accessToken);
}

export function createWorker(accessToken: string, input: CreateWorkerInput): Promise<{ worker: Worker; temporaryPassword: string }> {
  return authedJson("/api/v1/admin/workers", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateWorkerPermissions(accessToken: string, id: string, permissions: ModulePermissions): Promise<Worker> {
  return authedJson(`/api/v1/admin/workers/${encodeURIComponent(id)}/permissions`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permissions }),
  });
}

export function resetWorkerPassword(accessToken: string, id: string): Promise<{ temporaryPassword: string }> {
  return authedJson(`/api/v1/admin/workers/${encodeURIComponent(id)}/reset-password`, accessToken, { method: "POST" });
}

export function setWorkerActive(accessToken: string, id: string, active: boolean): Promise<Worker> {
  return authedJson(`/api/v1/admin/workers/${encodeURIComponent(id)}/${active ? "activate" : "deactivate"}`, accessToken, {
    method: "POST",
  });
}

/** Mi cuenta: cambio de la contraseña propia. Devuelve una sesión nueva (las anteriores quedan invalidadas). */
export function changeOwnPassword(accessToken: string, currentPassword: string, newPassword: string): Promise<TokenResponse> {
  return authedJson<TokenResponse>("/api/v1/users/me/password", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

/** Lugares para elegir en Eventos y Directorio (no exige el módulo Lugares). */
export function listPlaceOptions(accessToken: string): Promise<PlaceOption[]> {
  return authedJson("/api/v1/admin/place-options", accessToken);
}

/**
 * Un paso del flujo de publicación, igual para los 5 tipos de contenido
 * (POST /api/v1/admin/{tipo}/{id}/{paso}). `scheduledAt` para programar,
 * `note` para devolver a borrador.
 */
export function runPublicationStep(
  accessToken: string,
  kind: PublicationKind,
  id: string,
  step: PublicationStep,
  body?: { scheduledAt?: string; note?: string },
): Promise<unknown> {
  return authedJson(`/api/v1/admin/${kind}/${encodeURIComponent(id)}/${step}`, accessToken, {
    method: "POST",
    ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  });
}

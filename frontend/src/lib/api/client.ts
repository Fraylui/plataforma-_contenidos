// Cliente de datos para Server Components. Corre en el servidor de Next.js,
// nunca en el navegador -- por eso puede llamar directo al backend sin
// preocuparse por CORS (eso solo hace falta para mutaciones desde el
// navegador, que hoy no existen: no hay panel admin todavía).
import "server-only";
import type {
  ActiveCampaign,
  AdPlacement,
  Article,
  ArticleNeighbors,
  ArticleSummary,
  Business,
  BusinessSummary,
  BusinessType,
  Category,
  Event,
  EventSummary,
  FeedItem,
  FeedItemType,
  FeedPage,
  Gallery,
  GallerySummary,
  PageResponse,
  Place,
  PlaceSummary,
  PlatformSettings,
  SearchResult,
  SearchResultType,
} from "./types";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";

export class NotFoundError extends Error {}

async function apiFetch<T>(path: string, revalidateSeconds: number): Promise<T> {
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    next: { revalidate: revalidateSeconds },
  });

  if (res.status === 404) {
    throw new NotFoundError(`No encontrado: ${path}`);
  }
  if (!res.ok) {
    throw new Error(`Error del backend (${res.status}) en ${path}`);
  }
  return res.json() as Promise<T>;
}

/** Igual que apiFetch pero sin cache de Next.js — para respuestas que dependen de qué ya vio cada visitante (ver getFeed). */
async function apiFetchNoStore<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Error del backend (${res.status}) en ${path}`);
  }
  return res.json() as Promise<T>;
}

export function listPublishedArticles(params?: {
  categoryId?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<ArticleSummary>> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  query.set("page", String(params?.page ?? 0));
  query.set("size", String(params?.size ?? 20));

  // Listado: revalidación corta, cambia seguido (nuevas publicaciones).
  return apiFetch(`/api/v1/articles?${query.toString()}`, 60);
}

/**
 * CONTEXTO.md sección 16. `q` vacío ya devuelve página vacía en el backend,
 * no hace falta validarlo acá. Busca en todos los tipos de contenido
 * buscables (Artículos y Lugares hoy) — antes solo cubría Artículos.
 */
export function searchContent(
  q: string,
  params?: {
    page?: number;
    size?: number;
    type?: SearchResultType;
    categoryId?: string;
    /** Rango de fechas — solo tiene efecto cuando type es "EVENT" (único tipo con fecha propia filtrable). ISO 8601. */
    from?: string;
    to?: string;
  },
): Promise<PageResponse<SearchResult>> {
  const query = new URLSearchParams();
  query.set("q", q);
  query.set("page", String(params?.page ?? 0));
  query.set("size", String(params?.size ?? 20));
  if (params?.type) query.set("type", params.type);
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  return apiFetch(`/api/v1/search?${query.toString()}`, 60);
}

export function getPublishedArticleBySlug(slug: string): Promise<Article> {
  // Detalle: revalidación más larga, un artículo publicado rara vez cambia.
  return apiFetch(`/api/v1/articles/${encodeURIComponent(slug)}`, 300);
}

/** Navegación anterior/siguiente en la vista de lectura — ver ArticlePublicController.getNeighbors. */
export function getArticleNeighbors(slug: string): Promise<ArticleNeighbors> {
  return apiFetch(`/api/v1/articles/${encodeURIComponent(slug)}/neighbors`, 300);
}

const SITEMAP_PAGE_SIZE = 50; // = MAX_PAGE_SIZE en ArticlePublicController
const SITEMAP_MAX_PAGES = 200; // tope de seguridad: 10 000 artículos

/** Todos los artículos publicados, para sitemap.xml. No usar para listados de UI. */
export async function listAllPublishedArticlesForSitemap(): Promise<ArticleSummary[]> {
  const items: ArticleSummary[] = [];
  for (let page = 0; page < SITEMAP_MAX_PAGES; page++) {
    const result = await listPublishedArticles({ page, size: SITEMAP_PAGE_SIZE });
    items.push(...result.items);
    if (page + 1 >= result.totalPages) break;
  }
  return items;
}

export function listPublishedPlaces(params?: {
  categoryId?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<PlaceSummary>> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  query.set("page", String(params?.page ?? 0));
  query.set("size", String(params?.size ?? 20));
  return apiFetch(`/api/v1/places?${query.toString()}`, 60);
}

export function getPublishedPlaceBySlug(slug: string): Promise<Place> {
  return apiFetch(`/api/v1/places/${encodeURIComponent(slug)}`, 300);
}

/** Usado por la página de detalle de Evento para resolver el nombre/slug de un lugar vinculado (placeId). */
export function getPublishedPlaceById(id: string): Promise<PlaceSummary> {
  return apiFetch(`/api/v1/places/by-id/${encodeURIComponent(id)}`, 300);
}

const PLACES_SITEMAP_PAGE_SIZE = 50; // = MAX_PAGE_SIZE en PlacePublicController
const PLACES_SITEMAP_MAX_PAGES = 200;

/** Todos los lugares publicados, para sitemap.xml. No usar para listados de UI. */
export async function listAllPublishedPlacesForSitemap(): Promise<PlaceSummary[]> {
  const items: PlaceSummary[] = [];
  for (let page = 0; page < PLACES_SITEMAP_MAX_PAGES; page++) {
    const result = await listPublishedPlaces({ page, size: PLACES_SITEMAP_PAGE_SIZE });
    items.push(...result.items);
    if (page + 1 >= result.totalPages) break;
  }
  return items;
}

/**
 * Eventos públicos. `when` separa próximos de pasados (razón de ser de este
 * módulo — CONTEXTO.md, ver EventService.listPublished en el backend):
 * a diferencia de Artículo/Lugar, no se ordena por fecha de publicación.
 */
export function listPublishedEvents(params?: {
  categoryId?: string;
  when?: "upcoming" | "past";
  page?: number;
  size?: number;
}): Promise<PageResponse<EventSummary>> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  query.set("when", params?.when ?? "upcoming");
  query.set("page", String(params?.page ?? 0));
  query.set("size", String(params?.size ?? 20));
  return apiFetch(`/api/v1/events?${query.toString()}`, 60);
}

export function getPublishedEventBySlug(slug: string): Promise<Event> {
  return apiFetch(`/api/v1/events/${encodeURIComponent(slug)}`, 60);
}

const EVENTS_SITEMAP_PAGE_SIZE = 50; // = MAX_PAGE_SIZE en EventPublicController

export async function listAllPublishedEventsForSitemap(): Promise<EventSummary[]> {
  const items: EventSummary[] = [];
  for (let page = 0; ; page++) {
    const result = await listPublishedEvents({ when: "upcoming", page, size: EVENTS_SITEMAP_PAGE_SIZE });
    items.push(...result.items);
    if (page + 1 >= result.totalPages) break;
  }
  // Los eventos pasados también deben quedar indexados (contenido evergreen), no solo los próximos.
  for (let page = 0; ; page++) {
    const result = await listPublishedEvents({ when: "past", page, size: EVENTS_SITEMAP_PAGE_SIZE });
    items.push(...result.items);
    if (page + 1 >= result.totalPages) break;
  }
  return items;
}

export function listPublishedGalleries(params?: {
  categoryId?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<GallerySummary>> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  query.set("page", String(params?.page ?? 0));
  query.set("size", String(params?.size ?? 20));
  return apiFetch(`/api/v1/galleries?${query.toString()}`, 60);
}

export function getPublishedGalleryBySlug(slug: string): Promise<Gallery> {
  return apiFetch(`/api/v1/galleries/${encodeURIComponent(slug)}`, 300);
}

const GALLERIES_SITEMAP_PAGE_SIZE = 50; // = MAX_PAGE_SIZE en GalleryPublicController

export async function listAllPublishedGalleriesForSitemap(): Promise<GallerySummary[]> {
  const items: GallerySummary[] = [];
  for (let page = 0; ; page++) {
    const result = await listPublishedGalleries({ page, size: GALLERIES_SITEMAP_PAGE_SIZE });
    items.push(...result.items);
    if (page + 1 >= result.totalPages) break;
  }
  return items;
}

export function listPublishedBusinesses(params?: {
  categoryId?: string;
  businessType?: BusinessType;
  page?: number;
  size?: number;
}): Promise<PageResponse<BusinessSummary>> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  if (params?.businessType) query.set("businessType", params.businessType);
  query.set("page", String(params?.page ?? 0));
  query.set("size", String(params?.size ?? 20));
  return apiFetch(`/api/v1/directory?${query.toString()}`, 60);
}

export function getPublishedBusinessBySlug(slug: string): Promise<Business> {
  return apiFetch(`/api/v1/directory/${encodeURIComponent(slug)}`, 300);
}

const DIRECTORY_SITEMAP_PAGE_SIZE = 50; // = MAX_PAGE_SIZE en BusinessPublicController

export async function listAllPublishedBusinessesForSitemap(): Promise<BusinessSummary[]> {
  const items: BusinessSummary[] = [];
  for (let page = 0; ; page++) {
    const result = await listPublishedBusinesses({ page, size: DIRECTORY_SITEMAP_PAGE_SIZE });
    items.push(...result.items);
    if (page + 1 >= result.totalPages) break;
  }
  return items;
}

// Un módulo se declara visible si AL MENOS UNA de sus consultas (ej. eventos
// próximos + pasados) devuelve algo publicado.
const NAV_PRESENCE_CHECKS: { href: string; checks: () => Promise<PageResponse<unknown>>[] }[] = [
  { href: "/publicaciones", checks: () => [listPublishedArticles({ size: 1 })] },
  { href: "/lugares", checks: () => [listPublishedPlaces({ size: 1 })] },
  {
    href: "/eventos",
    checks: () => [listPublishedEvents({ when: "upcoming", size: 1 }), listPublishedEvents({ when: "past", size: 1 })],
  },
  { href: "/galerias", checks: () => [listPublishedGalleries({ size: 1 })] },
  { href: "/directorio", checks: () => [listPublishedBusinesses({ size: 1 })] },
];

/**
 * Qué módulos mostrar en la navegación (header/footer/menú mobile): un
 * enlace a un tipo de contenido sin nada publicado todavía es un enlace a
 * una página vacía, no navegación — confunde más de lo que ayuda.
 *
 * Recorre `NAV_PRESENCE_CHECKS` en vez de tener una variable por tipo: así
 * agregar un futuro tipo de contenido a la navegación es una entrada nueva
 * en esa lista, no otro `Promise.all` a mano. Cada `list*` ya usa `fetch`
 * con revalidación (Next dedupea automáticamente llamadas idénticas dentro
 * del mismo request), así que llamar esta función otra vez desde el footer
 * no repite trabajo real.
 */
export async function getPrimaryNavVisibility(): Promise<Record<string, boolean>> {
  const results = await Promise.all(
    NAV_PRESENCE_CHECKS.map(async ({ href, checks }) => {
      const pages = await Promise.all(checks());
      return [href, pages.some((page) => page.totalElements > 0)] as const;
    }),
  );
  return Object.fromEntries(results);
}

/**
 * Feed unificado del home (Publicaciones + Lugares + Eventos) — ver
 * FeedController.getFeed en el backend. Sin cache: cada visitante lleva su
 * propio `exclude`/`seed`, así que la respuesta no es la misma para todos
 * (no tiene sentido que Next.js la revalide/comparta).
 */
export function getFeed(params: { size?: number; exclude?: string[]; seed?: string }): Promise<FeedPage> {
  const query = new URLSearchParams();
  query.set("size", String(params.size ?? 12));
  if (params.seed) query.set("seed", params.seed);
  for (const id of params.exclude ?? []) query.append("exclude", id);
  return apiFetchNoStore(`/api/v1/feed?${query.toString()}`);
}

/**
 * Relacionados de la vista de detalle — ver FeedController.getRelated.
 * `categoryId` viene del propio recurso que la página de detalle ya cargó
 * (no hace falta otra consulta para resolverlo).
 */
export function getFeedRelated(params: {
  excludeType: FeedItemType;
  excludeId: string;
  categoryId: string | null;
  size?: number;
}): Promise<FeedItem[]> {
  if (!params.categoryId) return Promise.resolve([]);
  const query = new URLSearchParams();
  query.set("excludeType", params.excludeType);
  query.set("excludeId", params.excludeId);
  query.set("categoryId", params.categoryId);
  query.set("size", String(params.size ?? 6));
  // Detalle: revalidación corta, igual que el resto de listados públicos.
  return apiFetch(`/api/v1/feed/related?${query.toString()}`, 60);
}

/**
 * getFeedRelated con reserva: una categoría nueva/con poco contenido no debe
 * dejar la sección de relacionados vacía — de faltar, se completa con el
 * feed general del home (siempre contenido real, nunca relleno). Comparten
 * esta reserva las 3 páginas de detalle (Publicación/Lugar/Evento).
 */
export async function getRelatedWithFallback(params: {
  excludeType: FeedItemType;
  excludeId: string;
  categoryId: string | null;
  size?: number;
}): Promise<{ items: FeedItem[]; isFallback: boolean }> {
  const items = await getFeedRelated(params);
  if (items.length > 0) return { items, isFallback: false };

  const fallback = await getFeed({ size: params.size ?? 6, exclude: [params.excludeId] });
  return { items: fallback.items, isFallback: fallback.items.length > 0 };
}

export function listActiveCategories(): Promise<Category[]> {
  return apiFetch(`/api/v1/categories`, 300);
}

export function getCategoryById(id: string): Promise<Category> {
  return apiFetch(`/api/v1/categories/${encodeURIComponent(id)}`, 300);
}

/**
 * No hay endpoint de backend por slug (solo por id, sección arriba) — la
 * lista de categorías activas es chica (sección 4: ~24 de ejemplo), así
 * que no justifica un endpoint nuevo. `listActiveCategories()` ya cachea
 * 300s, así que esto no golpea el backend en cada llamada.
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await listActiveCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

/** Identidad/marca (CONTEXTO.md sección 14): reemplaza src/lib/platform-placeholder.ts. */
export function getPlatformSettings(): Promise<PlatformSettings> {
  return apiFetch(`/api/v1/platform-settings`, 300);
}

/** Posiciones de anuncio activas (sección 43.2) — consumido por AdBlock, ver components/legal/ad-block.tsx. */
export function listActiveAdPlacements(): Promise<AdPlacement[]> {
  return apiFetch(`/api/v1/ad-placements`, 300);
}

/**
 * Campaña de publicidad directa vigente para una posición, si hay una (ver
 * CampaignPublicController). Sin cache: cada llamada real cuenta como una
 * impresión en el backend, cachearla falsearía esa métrica.
 */
export async function getActiveCampaign(placementKey: string): Promise<ActiveCampaign | null> {
  const res = await fetch(`${BACKEND_API_URL}/api/v1/ads/campaigns/active?placementKey=${encodeURIComponent(placementKey)}`,
    { cache: "no-store" });
  if (res.status === 204) return null;
  if (!res.ok) {
    throw new Error(`Error del backend (${res.status}) en /api/v1/ads/campaigns/active`);
  }
  return res.json() as Promise<ActiveCampaign>;
}

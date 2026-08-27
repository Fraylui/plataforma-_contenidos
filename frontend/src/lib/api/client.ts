// Cliente de datos para Server Components. Corre en el servidor de Next.js,
// nunca en el navegador -- por eso puede llamar directo al backend sin
// preocuparse por CORS (eso solo hace falta para mutaciones desde el
// navegador, que hoy no existen: no hay panel admin todavía).
import "server-only";
import type {
  Article,
  ArticleSummary,
  Category,
  Event,
  EventSummary,
  Gallery,
  GallerySummary,
  GeographicUnit,
  PageResponse,
  Place,
  PlaceSummary,
  PlatformSettings,
  Review,
  ReviewSummary,
  SearchResult,
  SearchResultType,
  Tag,
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

export function listPublishedArticles(params?: {
  categoryId?: string;
  geographyId?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<ArticleSummary>> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  if (params?.geographyId) query.set("geographyId", params.geographyId);
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
  params?: { page?: number; size?: number; type?: SearchResultType },
): Promise<PageResponse<SearchResult>> {
  const query = new URLSearchParams();
  query.set("q", q);
  query.set("page", String(params?.page ?? 0));
  query.set("size", String(params?.size ?? 20));
  if (params?.type) query.set("type", params.type);
  return apiFetch(`/api/v1/search?${query.toString()}`, 60);
}

export function getPublishedArticleBySlug(slug: string): Promise<Article> {
  // Detalle: revalidación más larga, un artículo publicado rara vez cambia.
  return apiFetch(`/api/v1/articles/${encodeURIComponent(slug)}`, 300);
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
  geographyId?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<PlaceSummary>> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  if (params?.geographyId) query.set("geographyId", params.geographyId);
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
  geographyId?: string;
  when?: "upcoming" | "past";
  page?: number;
  size?: number;
}): Promise<PageResponse<EventSummary>> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  if (params?.geographyId) query.set("geographyId", params.geographyId);
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
  geographyId?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<GallerySummary>> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  if (params?.geographyId) query.set("geographyId", params.geographyId);
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

export function listPublishedReviews(params?: {
  categoryId?: string;
  geographyId?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<ReviewSummary>> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  if (params?.geographyId) query.set("geographyId", params.geographyId);
  query.set("page", String(params?.page ?? 0));
  query.set("size", String(params?.size ?? 20));
  return apiFetch(`/api/v1/reviews?${query.toString()}`, 60);
}

export function getPublishedReviewBySlug(slug: string): Promise<Review> {
  return apiFetch(`/api/v1/reviews/${encodeURIComponent(slug)}`, 300);
}

const REVIEWS_SITEMAP_PAGE_SIZE = 50; // = MAX_PAGE_SIZE en ReviewPublicController

export async function listAllPublishedReviewsForSitemap(): Promise<ReviewSummary[]> {
  const items: ReviewSummary[] = [];
  for (let page = 0; ; page++) {
    const result = await listPublishedReviews({ page, size: REVIEWS_SITEMAP_PAGE_SIZE });
    items.push(...result.items);
    if (page + 1 >= result.totalPages) break;
  }
  return items;
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

export function listGeographyChildren(params?: {
  level?: string;
  parentId?: string;
}): Promise<GeographicUnit[]> {
  const query = new URLSearchParams();
  if (params?.level) query.set("level", params.level);
  if (params?.parentId) query.set("parentId", params.parentId);
  return apiFetch(`/api/v1/geography?${query.toString()}`, 300);
}

export function getGeographyUnitById(id: string): Promise<GeographicUnit> {
  return apiFetch(`/api/v1/geography/${encodeURIComponent(id)}`, 300);
}

export function listAllTags(): Promise<Tag[]> {
  return apiFetch(`/api/v1/tags`, 300);
}

/** Identidad/marca (CONTEXTO.md sección 14): reemplaza src/lib/platform-placeholder.ts. */
export function getPlatformSettings(): Promise<PlatformSettings> {
  return apiFetch(`/api/v1/platform-settings`, 300);
}

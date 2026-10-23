// Cliente de datos para Server Components. Corre en el servidor de Next.js,
// nunca en el navegador -- por eso puede llamar directo al backend sin
// preocuparse por CORS (eso solo hace falta para mutaciones desde el
// navegador, que hoy no existen: no hay panel admin todavía).
import "server-only";
import { PUBLIC_CONTENT_TAG } from "@/lib/cache-tags";
import type {
  ActiveTopic,
  StoryDetail,
  StoryView,
  AdPlacement,
  Publication,
  PublicationSummary,
  Category,
  Episode,
  EpisodeView,
  Celebration,
  CelebrationSummary,
  FeedItem,
  FeedItemType,
  FeedPage,
  FeedTopic,
  LiveStream,
  Gallery,
  GallerySummary,
  PageResponse,
  Place,
  PlaceSummary,
  PlatformSettings,
  SearchResult,
  SearchResultType,
  SeriesCard,
  SeriesSummary,
} from "./types";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";

import { BackendError, NotFoundError } from "./errors";
export { NotFoundError } from "./errors";

async function apiFetch<T>(path: string, revalidateSeconds: number): Promise<T> {
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    next: { revalidate: revalidateSeconds, tags: [PUBLIC_CONTENT_TAG] },
  });

  if (res.status === 404) {
    throw new NotFoundError(`No encontrado: ${path}`);
  }
  if (!res.ok) {
    throw new BackendError(`Error del backend (${res.status}) en ${path}`, res.status, res.headers.get("X-Request-Id"));
  }
  return res.json() as Promise<T>;
}

export function listPublishedPublications(params?: {
  categoryId?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<PublicationSummary>> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  query.set("page", String(params?.page ?? 0));
  query.set("size", String(params?.size ?? 20));

  // Listado: revalidación corta, cambia seguido (nuevas publicaciones).
  return apiFetch(`/api/v1/publications?${query.toString()}`, 60);
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
    /** Rango de fechas — solo tiene efecto cuando type es "CELEBRATION" (único tipo con fecha propia filtrable). ISO 8601. */
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

export function getPublishedPublicationBySlug(slug: string): Promise<Publication> {
  // Detalle: revalidación más larga, un artículo publicado rara vez cambia.
  return apiFetch(`/api/v1/publications/${encodeURIComponent(slug)}`, 300);
}

const SITEMAP_PAGE_SIZE = 50; // = MAX_PAGE_SIZE en PublicationPublicController
const SITEMAP_MAX_PAGES = 200; // tope de seguridad: 10 000 artículos

/** Todos los artículos publicados, para sitemap.xml. No usar para listados de UI. */
export async function listAllPublishedPublicationsForSitemap(): Promise<PublicationSummary[]> {
  const items: PublicationSummary[] = [];
  for (let page = 0; page < SITEMAP_MAX_PAGES; page++) {
    const result = await listPublishedPublications({ page, size: SITEMAP_PAGE_SIZE });
    items.push(...result.items);
    if (page + 1 >= result.totalPages) break;
  }
  return items;
}

function listPublishedPlaces(params?: {
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

/** Usado por la página de detalle de Celebración para resolver el nombre/slug de un lugar vinculado (placeId). */
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
 * a diferencia de Publicación/Lugar, no se ordena por fecha de publicación.
 */
export function listPublishedCelebrations(params?: {
  categoryId?: string;
  when?: "upcoming" | "past";
  page?: number;
  size?: number;
}): Promise<PageResponse<CelebrationSummary>> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  query.set("when", params?.when ?? "upcoming");
  query.set("page", String(params?.page ?? 0));
  query.set("size", String(params?.size ?? 20));
  return apiFetch(`/api/v1/celebrations?${query.toString()}`, 60);
}

/**
 * «Hoy se celebra» para quien no tiene ubicación conocida: lo mundial y lo
 * del país del sitio. Va en el HTML en caché; el navegador lo cambia por lo
 * de su lugar con /api/celebrations/today (ver TodayCelebrations).
 */
export function listTodayCelebrations(): Promise<CelebrationSummary[]> {
  return apiFetch("/api/v1/celebrations/today", 300);
}

export function getPublishedCelebrationBySlug(slug: string): Promise<Celebration> {
  return apiFetch(`/api/v1/celebrations/${encodeURIComponent(slug)}`, 60);
}

const CELEBRATIONS_SITEMAP_PAGE_SIZE = 50; // = MAX_PAGE_SIZE en EventPublicController

export async function listAllPublishedCelebrationsForSitemap(): Promise<CelebrationSummary[]> {
  const items: CelebrationSummary[] = [];
  for (let page = 0; ; page++) {
    const result = await listPublishedCelebrations({ when: "upcoming", page, size: CELEBRATIONS_SITEMAP_PAGE_SIZE });
    items.push(...result.items);
    if (page + 1 >= result.totalPages) break;
  }
  // Los eventos pasados también deben quedar indexados (contenido evergreen), no solo los próximos.
  for (let page = 0; ; page++) {
    const result = await listPublishedCelebrations({ when: "past", page, size: CELEBRATIONS_SITEMAP_PAGE_SIZE });
    items.push(...result.items);
    if (page + 1 >= result.totalPages) break;
  }
  return items;
}

function listPublishedGalleries(params?: {
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

// --- En vivo (transmisiones de YouTube) ---

/**
 * La transmisión en vivo ahora, o null. Revalida cada 30 s: cuando el
 * equipo toca "Estamos en vivo", el aviso del inicio aparece en menos de un
 * minuto sin que cada visita consulte al backend.
 */
export async function getLiveNow(): Promise<LiveStream | null> {
  const res = await fetch(`${BACKEND_API_URL}/api/v1/live/now`, {
    next: { revalidate: 30, tags: [PUBLIC_CONTENT_TAG] },
  });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`Error del backend (${res.status}) en /api/v1/live/now`);
  return (await res.json()) as LiveStream;
}

export function listUpcomingLive(): Promise<LiveStream[]> {
  return apiFetch("/api/v1/live/upcoming", 60);
}

/** Fila del Inicio: temas con historias sin caducar, el más reciente primero (caché corta: caducan a la hora exacta). */
export function listActiveStories(): Promise<ActiveTopic[]> {
  return apiFetch("/api/v1/stories/active", 30);
}

/** Una historia activa o Destacada, con su tema; NotFoundError si caducó o no existe. */
export function getStory(id: string): Promise<StoryDetail> {
  return apiFetch(`/api/v1/stories/${encodeURIComponent(id)}`, 30);
}

/** Destacadas de un tema, la más nueva primero. */
export function listStoryHighlights(categoryId: string): Promise<StoryView[]> {
  return apiFetch(`/api/v1/stories/highlights?categoryId=${encodeURIComponent(categoryId)}`, 60);
}

export function getLiveBySlug(slug: string): Promise<LiveStream> {
  return apiFetch(`/api/v1/live/${encodeURIComponent(slug)}`, 30);
}

// --- Series (programas de YouTube) ---

export function listPublishedSeries(params?: { page?: number; size?: number }): Promise<PageResponse<SeriesCard>> {
  const query = new URLSearchParams({ page: String(params?.page ?? 0), size: String(params?.size ?? 24) });
  return apiFetch(`/api/v1/series?${query.toString()}`, 60);
}

export function getPublishedSeriesBySlug(slug: string): Promise<SeriesSummary> {
  return apiFetch(`/api/v1/series/${encodeURIComponent(slug)}`, 300);
}

export function listSeriesEpisodes(slug: string, params?: { page?: number; size?: number }): Promise<PageResponse<Episode>> {
  const query = new URLSearchParams({ page: String(params?.page ?? 0), size: String(params?.size ?? 24) });
  return apiFetch(`/api/v1/series/${encodeURIComponent(slug)}/episodes?${query.toString()}`, 60);
}

export function getPublishedEpisode(seriesSlug: string, episodeSlug: string): Promise<EpisodeView> {
  return apiFetch(`/api/v1/series/${encodeURIComponent(seriesSlug)}/episodes/${encodeURIComponent(episodeSlug)}`, 300);
}

/** Series y sus episodios para sitemap.xml (MAX = 48 por página en SeriesPublicController). */
export async function listAllSeriesWithEpisodesForSitemap(): Promise<{ series: SeriesSummary; episodes: Episode[] }[]> {
  const cards: SeriesCard[] = [];
  for (let page = 0; ; page++) {
    const result = await listPublishedSeries({ page, size: 48 });
    cards.push(...result.items);
    if (page + 1 >= result.totalPages) break;
  }
  return Promise.all(
    cards.map(async ({ series }) => {
      const episodes: Episode[] = [];
      for (let page = 0; ; page++) {
        const result = await listSeriesEpisodes(series.slug, { page, size: 48 });
        episodes.push(...result.items);
        if (page + 1 >= result.totalPages) break;
      }
      return { series, episodes };
    }),
  );
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

// Un módulo se declara visible si AL MENOS UNA de sus consultas (ej. eventos
// próximos + pasados) devuelve algo publicado.
const NAV_PRESENCE_CHECKS: { href: string; checks: () => Promise<PageResponse<unknown>>[] }[] = [
  { href: "/publicaciones", checks: () => [listPublishedPublications({ size: 1 })] },
  { href: "/lugares", checks: () => [listPublishedPlaces({ size: 1 })] },
  {
    href: "/celebraciones",
    checks: () => [listPublishedCelebrations({ when: "upcoming", size: 1 }), listPublishedCelebrations({ when: "past", size: 1 })],
  },
  { href: "/galerias", checks: () => [listPublishedGalleries({ size: 1 })] },
  { href: "/series", checks: () => [listPublishedSeries({ size: 1 })] },
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
 * FeedController.getFeed en el backend. Con caché como el resto: desde el
 * servidor solo se pide el primer lote del home (semilla por hora, igual
 * para todos — ver app/(public)/page.tsx) y la reserva de relacionados;
 * las páginas siguientes del scroll, que sí dependen de cada visitante,
 * van por app/api/feed/route.ts sin caché.
 */
/** "Lo más gustado" del home — ver FeedController.getTopLiked (solo contenido con me gusta reales). */
export function getTopLiked(size = 5): Promise<FeedItem[]> {
  return apiFetch(`/api/v1/feed/top?size=${size}`, 60);
}

export function getFeed(params: {
  size?: number;
  exclude?: string[];
  seed?: string;
  type?: FeedItemType;
  categoryId?: string;
  /** Celebraciones: con type CELEBRATION, por la próxima vez que tocan. */
  sort?: "upcoming";
}): Promise<FeedPage> {
  const query = new URLSearchParams();
  query.set("size", String(params.size ?? 12));
  if (params.seed) query.set("seed", params.seed);
  if (params.type) query.set("type", params.type);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.sort) query.set("sort", params.sort);
  for (const id of params.exclude ?? []) query.append("exclude", id);
  return apiFetch(`/api/v1/feed?${query.toString()}`, 60);
}

/** Círculos de temas del feed — ver FeedController.getTopics. Si falla, el feed sigue sin círculos. */
export function getFeedTopics(): Promise<FeedTopic[]> {
  return apiFetch("/api/v1/feed/topics", 60);
}

/**
 * Relacionados de la vista de detalle — ver FeedController.getRelated.
 * `categoryId` viene del propio recurso que la página de detalle ya cargó
 * (no hace falta otra consulta para resolverlo).
 */
function getFeedRelated(params: {
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
 * Contenido para la columna lateral del detalle: `related` (misma categoría)
 * y `more` (feed general) que completa hasta `size`, sin repetir ni incluir
 * el contenido actual. Antes la reserva solo entraba con CERO relacionados:
 * un tema con 1 contenido dejaba la columna con un solo ítem y un hueco
 * largo debajo. Siempre contenido real, nunca relleno.
 */
export async function getRelatedWithFallback(params: {
  excludeType: FeedItemType;
  excludeId: string;
  categoryId: string | null;
  size?: number;
}): Promise<{ related: FeedItem[]; more: FeedItem[] }> {
  const size = params.size ?? 6;
  const related = await getFeedRelated({ ...params, size });
  if (related.length >= size) return { related, more: [] };

  const fallback = await getFeed({ size: size * 2, exclude: [params.excludeId] });
  const seen = new Set([params.excludeId, ...related.map((item) => item.id)]);
  const more = fallback.items.filter((item) => !seen.has(item.id)).slice(0, size - related.length);
  return { related, more };
}

export function listActiveCategories(): Promise<Category[]> {
  return apiFetch(`/api/v1/categories`, 300);
}

/**
 * Los temas que ve el visitante: solo los que tienen algo publicado (y sus
 * padres). Decisión del dueño 2026-10-21: un tema vacío no se muestra. Para
 * traducir un id a nombre sigue sirviendo listActiveCategories.
 */
export function listCategoriesWithContent(): Promise<Category[]> {
  return apiFetch(`/api/v1/categories?withContent=true`, 300);
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
/** Página pública de un tema: un tema sin contenido no existe para el visitante (404). */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await listCategoriesWithContent();
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


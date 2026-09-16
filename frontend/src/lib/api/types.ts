// Tipos que reflejan los DTOs del backend (ver
// backend/src/main/java/pe/plataformacontenidos/content/api/dto/*).
// Mantener sincronizados a mano por ahora; si esto crece, considerar
// generarlos desde una spec OpenAPI.

export type ArticleType =
  | "ARTICULO"
  | "NOTICIA"
  | "REPORTAJE"
  | "CRONICA"
  | "GUIA"
  | "ENTREVISTA"
  | "HISTORIA"
  | "RANKING"
  | "TUTORIAL"
  | "OPINION";

export type ArticleStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED" | "REJECTED";

/** Ver ContentImageResponse.java — una imagen subida (imageId) o por enlace externo (externalUrl), nunca ambas. */
export interface ContentImage {
  imageId: string | null;
  externalUrl: string | null;
  title: string | null;
  caption: string | null;
}

/** Ver ContentVideoResponse.java — solo la referencia (Video ID de YouTube), nunca el video en sí. */
export interface ContentVideo {
  videoId: string;
  title: string | null;
  caption: string | null;
}

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  articleType: ArticleType;
  categoryId: string;
  coverImageId: string | null;
  coverImageUrl: string | null;
  hasVideo: boolean;
  publishedAt: string | null;
  likeCount: number;
}

export interface ArticleNeighbors {
  previous: ArticleSummary | null;
  next: ArticleSummary | null;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  articleType: ArticleType;
  status: ArticleStatus;
  authorId: string;
  categoryId: string;
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  images: ContentImage[];
  videos: ContentVideo[];
  robots: string;
  rejectionReason: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
}

/** Ver SearchResultResponse.java (CONTEXTO.md sección 16) — resultado unificado de Artículos, Lugares, Eventos, Galerías y Directorio. */
export type SearchResultType = "ARTICLE" | "PLACE" | "EVENT" | "GALLERY" | "BUSINESS";

export interface SearchResult {
  contentType: SearchResultType;
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  categoryId: string | null;
  featuredImageId: string | null;
  featuredImageUrl: string | null;
  hasVideo: boolean;
  publishedAt: string | null;
  /** Solo Evento la trae (rango de fechas del buscador) — null en los demás tipos. */
  eventStartsAt: string | null;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  active: boolean;
  sortOrder: number;
}

/** Mismos valores que ArticleStatus (CONTEXTO.md sección 12) — PlaceStatus es un enum propio en el backend (sección 38), pero el frontend no tiene esa restricción de bounded context. */
export type PlaceStatus = ArticleStatus;

export interface PlaceSummary {
  id: string;
  slug: string;
  name: string;
  excerpt: string | null;
  categoryId: string;
  latitude: number | null;
  longitude: number | null;
  coverImageId: string | null;
  coverImageUrl: string | null;
  hasVideo: boolean;
  publishedAt: string | null;
  likeCount: number;
}

export interface Place {
  id: string;
  slug: string;
  name: string;
  excerpt: string | null;
  body: string;
  status: PlaceStatus;
  authorId: string;
  categoryId: string;
  latitude: number | null;
  longitude: number | null;
  images: ContentImage[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  videos: ContentVideo[];
  robots: string;
  rejectionReason: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  likeCount: number;
}

/** Mismos valores que ArticleStatus/PlaceStatus (CONTEXTO.md sección 12) — EventStatus es un enum propio en el backend (sección 38). */
export type EventStatus = ArticleStatus;

export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  categoryId: string;
  placeId: string | null;
  venueName: string | null;
  startsAt: string;
  endsAt: string | null;
  coverImageId: string | null;
  coverImageUrl: string | null;
  hasVideo: boolean;
  likeCount: number;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  status: EventStatus;
  authorId: string;
  categoryId: string;
  placeId: string | null;
  venueName: string | null;
  startsAt: string;
  endsAt: string | null;
  images: ContentImage[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  videos: ContentVideo[];
  robots: string;
  rejectionReason: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  likeCount: number;
}

/** Mismos valores que ArticleStatus/PlaceStatus/EventStatus (CONTEXTO.md sección 12) — GalleryStatus es un enum propio en el backend (sección 38). */
export type GalleryStatus = ArticleStatus;

export interface GallerySummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  categoryId: string;
  images: ContentImage[];
  publishedAt: string | null;
  likeCount: number;
}

export interface Gallery {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  status: GalleryStatus;
  authorId: string;
  categoryId: string;
  images: ContentImage[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  robots: string;
  rejectionReason: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  likeCount: number;
}

/** Mismos valores que ArticleStatus/PlaceStatus/EventStatus/GalleryStatus (CONTEXTO.md sección 12) — BusinessStatus es un enum propio en el backend (sección 38). */
export type BusinessStatus = ArticleStatus;

/** Ver BusinessType.java (CONTEXTO.md sección 6) — eje de filtrado del Directorio, distinto de la categoría de contenido. */
export type BusinessType = "RESTAURANT" | "HOTEL" | "SERVICE" | "SHOP" | "OTHER";

export interface BusinessSummary {
  id: string;
  slug: string;
  name: string;
  excerpt: string | null;
  businessType: BusinessType;
  categoryId: string;
  placeId: string | null;
  address: string | null;
  coverImageId: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
  likeCount: number;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  excerpt: string | null;
  body: string;
  status: BusinessStatus;
  businessType: BusinessType;
  authorId: string;
  categoryId: string;
  placeId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  images: ContentImage[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  videos: ContentVideo[];
  robots: string;
  rejectionReason: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  likeCount: number;
}

/** Ver PlatformSettingsResponse.java (CONTEXTO.md sección 14). */
export interface PlatformSettings {
  name: string;
  shortName: string | null;
  description: string | null;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  backgroundColor: string | null;
  fontFamily: string | null;
  theme: "LIGHT" | "DARK" | "AUTO";
  seoDefaultTitle: string | null;
  seoDefaultDescription: string | null;
  seoDefaultImageUrl: string | null;
  googleSearchConsoleVerification: string | null;
  contactEmail: string | null;
  adsenseEnabled: boolean;
  adsenseClientId: string | null;
  analyticsId: string | null;
}

/** Ver AdPlacementResponse.java — posición de anuncio configurable (CONTEXTO.md sección 43.2). */
export interface AdPlacement {
  id: string;
  key: string;
  label: string;
  adsenseSlotId: string | null;
  enabled: boolean;
}

/** Ver ActiveCampaignResponse.java — nunca trae el link real, solo `id` para armar el link de clic. */
export interface ActiveCampaign {
  id: string;
  imageId: string | null;
  externalImageUrl: string | null;
  imageAlt: string | null;
}

/** Ver FeedItemResponse.java — feed unificado del home y "relacionados" de la vista de detalle. */
export type FeedItemType = "ARTICLE" | "PLACE" | "EVENT";

export interface FeedItem {
  type: FeedItemType;
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  articleType: ArticleType | null;
  categoryId: string | null;
  coverImageId: string | null;
  coverImageUrl: string | null;
  hasVideo: boolean;
  publishedAt: string | null;
  likeCount: number;
}

/** Ver FeedPageResponse.java. `hasMore` indica si queda contenido sin mostrar dado lo ya excluido. */
export interface FeedPage {
  items: FeedItem[];
  hasMore: boolean;
}

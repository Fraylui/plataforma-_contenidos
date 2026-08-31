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

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  articleType: ArticleType;
  categoryId: string;
  geographyId: string | null;
  featuredImageId: string | null;
  hasVideo: boolean;
  publishedAt: string | null;
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
  geographyId: string | null;
  tagIds: string[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  featuredImageId: string | null;
  youtubeVideoId: string | null;
  robots: string;
  rejectionReason: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  likedByVisitor: boolean;
}

/** Ver SearchResultResponse.java (CONTEXTO.md sección 16) — resultado unificado de Artículos, Lugares, Eventos, Galerías y Reseñas. */
export type SearchResultType = "ARTICLE" | "PLACE" | "EVENT" | "GALLERY" | "REVIEW" | "BUSINESS";

export interface SearchResult {
  contentType: SearchResultType;
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  categoryId: string | null;
  geographyId: string | null;
  featuredImageId: string | null;
  hasVideo: boolean;
  publishedAt: string | null;
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

export type GeographyLevel = "PAIS" | "REGION" | "PROVINCIA" | "DISTRITO" | "LOCALIDAD";

export interface GeographicUnit {
  id: string;
  name: string;
  slug: string;
  level: GeographyLevel;
  parentId: string | null;
  active: boolean;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

/** Mismos valores que ArticleStatus (CONTEXTO.md sección 12) — PlaceStatus es un enum propio en el backend (sección 38), pero el frontend no tiene esa restricción de bounded context. */
export type PlaceStatus = ArticleStatus;

export interface PlaceSummary {
  id: string;
  slug: string;
  name: string;
  excerpt: string | null;
  categoryId: string;
  geographyId: string | null;
  latitude: number | null;
  longitude: number | null;
  coverImageId: string | null;
  hasVideo: boolean;
  publishedAt: string | null;
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
  geographyId: string | null;
  latitude: number | null;
  longitude: number | null;
  imageIds: string[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  youtubeVideoId: string | null;
  robots: string;
  rejectionReason: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  relatedArticles: ArticleSummary[];
  likeCount: number;
  likedByVisitor: boolean;
}

/** Mismos valores que ArticleStatus/PlaceStatus (CONTEXTO.md sección 12) — EventStatus es un enum propio en el backend (sección 38). */
export type EventStatus = ArticleStatus;

export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  categoryId: string;
  geographyId: string | null;
  placeId: string | null;
  venueName: string | null;
  startsAt: string;
  endsAt: string | null;
  coverImageId: string | null;
  hasVideo: boolean;
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
  geographyId: string | null;
  placeId: string | null;
  venueName: string | null;
  startsAt: string;
  endsAt: string | null;
  imageIds: string[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  youtubeVideoId: string | null;
  robots: string;
  rejectionReason: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  likeCount: number;
  likedByVisitor: boolean;
}

/** Mismos valores que ArticleStatus/PlaceStatus/EventStatus (CONTEXTO.md sección 12) — GalleryStatus es un enum propio en el backend (sección 38). */
export type GalleryStatus = ArticleStatus;

export interface GallerySummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  categoryId: string;
  geographyId: string | null;
  imageIds: string[];
  publishedAt: string | null;
}

export interface Gallery {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  status: GalleryStatus;
  authorId: string;
  categoryId: string;
  geographyId: string | null;
  imageIds: string[];
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
  likedByVisitor: boolean;
}

/** Mismos valores que ArticleStatus/PlaceStatus/EventStatus/GalleryStatus (CONTEXTO.md sección 12) — ReviewStatus es un enum propio en el backend (sección 38). */
export type ReviewStatus = ArticleStatus;

export interface ReviewSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  categoryId: string;
  geographyId: string | null;
  placeId: string | null;
  subjectName: string | null;
  rating: number;
  coverImageId: string | null;
  publishedAt: string | null;
}

export interface Review {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  status: ReviewStatus;
  authorId: string;
  categoryId: string;
  geographyId: string | null;
  placeId: string | null;
  subjectName: string | null;
  rating: number;
  imageIds: string[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  youtubeVideoId: string | null;
  robots: string;
  rejectionReason: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  likeCount: number;
  likedByVisitor: boolean;
}

/** Mismos valores que ReviewStatus (CONTEXTO.md sección 12) — BusinessStatus es un enum propio en el backend (sección 38). */
export type BusinessStatus = ArticleStatus;

/** Ver BusinessType.java (CONTEXTO.md sección 6) — eje de filtrado del Directorio, distinto de la categoría editorial. */
export type BusinessType = "RESTAURANT" | "HOTEL" | "SERVICE" | "SHOP" | "OTHER";

export interface BusinessSummary {
  id: string;
  slug: string;
  name: string;
  excerpt: string | null;
  businessType: BusinessType;
  categoryId: string;
  geographyId: string | null;
  placeId: string | null;
  address: string | null;
  coverImageId: string | null;
  publishedAt: string | null;
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
  geographyId: string | null;
  placeId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  imageIds: string[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  youtubeVideoId: string | null;
  robots: string;
  rejectionReason: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  likeCount: number;
  likedByVisitor: boolean;
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
  adsenseSlotArticle: string | null;
  adsenseSlotListing: string | null;
}

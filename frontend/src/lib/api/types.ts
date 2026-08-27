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
  | "RESENA"
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
}

/** Ver PlatformSettingsResponse.java (CONTEXTO.md sección 14). */
export interface PlatformSettings {
  name: string;
  shortName: string | null;
  description: string | null;
  slogan: string | null;
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
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  adsenseEnabled: boolean;
  adsenseClientId: string | null;
  analyticsId: string | null;
}

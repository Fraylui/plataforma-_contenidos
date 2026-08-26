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

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  articleType: ArticleType;
  categoryId: string;
  geographyId: string | null;
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
  status: string;
  authorId: string;
  categoryId: string;
  geographyId: string | null;
  tagIds: string[];
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

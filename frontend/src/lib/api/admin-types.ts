// Tipos de las respuestas admin del backend (identity + content module). Ver
// backend/src/main/java/pe/plataformacontenidos/{identity,content}/api/dto/*.
import type { ArticleStatus, ArticleType, BusinessType, ContentImage } from "./types";

/** Cuerpo de un video en ArticleInput/PlaceInput/EventInput — ver ContentVideoInput.java. */
export interface ContentVideoInput {
  url: string;
  title: string | null;
  caption: string | null;
}

export type Role = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "AUTHOR" | "MODERATOR" | "COLLABORATOR" | "USER";

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

/** Cuerpo de POST/PUT /api/v1/admin/articles — ver ArticleRequest.java. */
export interface ArticleInput {
  title: string;
  excerpt: string | null;
  body: string;
  articleType: ArticleType;
  categoryId: string;
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  images: ContentImage[];
  videos: ContentVideoInput[];
  robots: string;
}

/** Cuerpo de POST/PUT /api/v1/admin/places — ver PlaceRequest.java (CONTEXTO.md sección 6). */
export interface PlaceInput {
  name: string;
  excerpt: string | null;
  body: string;
  categoryId: string;
  latitude: number | null;
  longitude: number | null;
  images: ContentImage[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  videos: ContentVideoInput[];
  robots: string;
}

/** Cuerpo de POST/PUT /api/v1/admin/events — ver EventRequest.java. */
export interface EventInput {
  title: string;
  excerpt: string | null;
  body: string;
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
  videos: ContentVideoInput[];
  robots: string;
}

/** Cuerpo de POST/PUT /api/v1/admin/galleries — ver GalleryRequest.java. */
export interface GalleryInput {
  title: string;
  excerpt: string | null;
  categoryId: string;
  imageIds: string[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  robots: string;
}

/** Cuerpo de POST/PUT /api/v1/admin/directory — ver BusinessRequest.java. */
export interface BusinessInput {
  name: string;
  excerpt: string | null;
  body: string;
  categoryId: string;
  businessType: BusinessType;
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
  youtubeUrl: string | null;
  robots: string;
}

/** Cuerpo de POST /api/v1/admin/categories — ver CreateCategoryRequest.java. */
export interface CategoryCreateInput {
  name: string;
  description: string | null;
  parentId: string | null;
}

/** Cuerpo de PUT /api/v1/admin/categories/{id} — ver UpdateCategoryRequest.java. */
export interface CategoryUpdateInput extends CategoryCreateInput {
  sortOrder: number;
}

/** Cuerpo de POST /api/v1/admin/users — ver CreateUserRequest.java. */
export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
}

/** Cuerpo de PUT /api/v1/admin/platform-settings — ver UpdatePlatformSettingsRequest.java. */
export interface PlatformSettingsInput {
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

/** Cuerpo de POST /api/v1/admin/ad-placements — ver CreateAdPlacementRequest.java. */
export interface AdPlacementCreateInput {
  key: string;
  label: string;
  adsenseSlotId: string | null;
}

/** Cuerpo de PUT /api/v1/admin/ad-placements/{id} — ver UpdateAdPlacementRequest.java. */
export interface AdPlacementUpdateInput {
  label: string;
  adsenseSlotId: string | null;
}

/** Ver Advertiser.java. */
export interface Advertiser {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
}

/** Cuerpo de POST/PUT /api/v1/admin/advertisers — ver AdvertiserRequest.java. */
export interface AdvertiserInput {
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
}

/** Ver CampaignResponse.java. La creatividad es XOR: imageId o externalImageUrl, nunca ambas. */
export interface Campaign {
  id: string;
  advertiserId: string;
  placementKey: string;
  imageId: string | null;
  externalImageUrl: string | null;
  imageAlt: string | null;
  linkUrl: string;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  impressionCount: number;
  clickCount: number;
}

/** Cuerpo de POST/PUT /api/v1/admin/campaigns — ver CampaignRequest.java. */
export interface CampaignInput {
  advertiserId: string;
  placementKey: string;
  imageId: string | null;
  externalImageUrl: string | null;
  imageAlt: string | null;
  linkUrl: string;
  startsAt: string | null;
  endsAt: string | null;
}

/** Ver PlatformStatsResponse.java (CONTEXTO.md sección 34, estadísticas básicas). */
export interface PlatformStats {
  articlesByStatus: Record<ArticleStatus, number>;
  articlesPublishedLast30Days: number;
  placesByStatus: Record<ArticleStatus, number>;
  eventsByStatus: Record<ArticleStatus, number>;
  galleriesByStatus: Record<ArticleStatus, number>;
  businessesByStatus: Record<ArticleStatus, number>;
  totalCategories: number;
  activeCategories: number;
  usersByRole: Record<Role, number>;
  activeUsers: number;
}

/** Ver ImageResponse.java. `url` es relativa — resolver con src/lib/image-url.ts. */
export interface AdminImage {
  id: string;
  originalFilename: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  width: number;
  height: number;
  altText: string | null;
  uploadedBy: string;
  createdAt: string;
}

/** Ver AuditEventResponse.java (CONTEXTO.md secciones 18 y 35.3, fase 1). */
export type AuditResult = "SUCCESS" | "FAILURE";

export interface AuditEvent {
  id: string;
  occurredAt: string;
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  result: AuditResult;
}

export interface AuditSearchFilters {
  actorEmail?: string;
  action?: string;
  resourceType?: string;
  result?: AuditResult;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

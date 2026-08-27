// Tipos de las respuestas admin del backend (identity + content module). Ver
// backend/src/main/java/pe/plataformacontenidos/{identity,content}/api/dto/*.
import type { ArticleStatus, ArticleType, GeographyLevel } from "./types";

export type Role = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "AUTHOR" | "MODERATOR" | "COLLABORATOR" | "USER";

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  mfaSetupRequired: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  mfaEnabled: boolean;
}

export interface MfaEnrollment {
  provisioningUri: string;
  secretBase32: string;
}

export interface MfaBackupCodes {
  backupCodes: string[];
}

export interface ApiError {
  timestamp: string;
  status: number;
  message: string;
  details: string[];
}

/** Cuerpo de POST/PUT /api/v1/admin/articles — ver ArticleRequest.java. */
export interface ArticleInput {
  title: string;
  excerpt: string | null;
  body: string;
  articleType: ArticleType;
  categoryId: string;
  geographyId: string | null;
  tagNames: string[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  featuredImageId: string | null;
  youtubeUrl: string | null;
  robots: string;
}

/** Cuerpo de POST/PUT /api/v1/admin/places — ver PlaceRequest.java (CONTEXTO.md sección 6). */
export interface PlaceInput {
  name: string;
  excerpt: string | null;
  body: string;
  categoryId: string;
  geographyId: string | null;
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

/** Cuerpo de POST /api/v1/admin/geography — ver CreateGeographicUnitRequest.java. */
export interface GeographyCreateInput {
  name: string;
  level: GeographyLevel;
  parentId: string | null;
}

/** Cuerpo de POST /api/v1/admin/users — ver CreateUserRequest.java. */
export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
  role: Role;
}

/** Cuerpo de PUT /api/v1/admin/platform-settings — ver UpdatePlatformSettingsRequest.java. */
export interface PlatformSettingsInput {
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

/** Ver PlatformStatsResponse.java (CONTEXTO.md sección 34, estadísticas básicas). */
export interface PlatformStats {
  articlesByStatus: Record<ArticleStatus, number>;
  articlesPublishedLast30Days: number;
  totalCategories: number;
  activeCategories: number;
  totalTags: number;
  totalGeographyUnits: number;
  activeGeographyUnits: number;
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

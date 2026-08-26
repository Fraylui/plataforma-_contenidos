// Tipos de las respuestas admin del backend (identity + content module). Ver
// backend/src/main/java/pe/plataformacontenidos/{identity,content}/api/dto/*.
import type { ArticleType, GeographyLevel } from "./types";

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

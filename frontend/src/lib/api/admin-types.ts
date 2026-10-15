import type { AdSection } from "@/lib/ads/ad-context";
// Tipos de las respuestas admin del backend (identity + content module). Ver
// backend/src/main/java/pe/plataformacontenidos/{identity,content}/api/dto/*.
import type { PublicationStatus, ArticleType, BusinessType, ContentImage, FeedItemType } from "./types";

/** Cuerpo de un video en ArticleInput/PlaceInput/EventInput — ver ContentVideoInput.java. */
export interface ContentVideoInput {
  url: string;
  title: string | null;
  caption: string | null;
}

/** Roles del panel (spec 2a): el dueño puede todo; el trabajador, lo que digan sus permisos. */
export type Role = "OWNER" | "WORKER";

/** Módulos que se asignan a un trabajador (espejo de Module.java). */
export type Module =
  | "ARTICLES"
  | "PLACES"
  | "EVENTS"
  | "GALLERIES"
  | "DIRECTORY"
  | "SERIES"
  | "CATEGORIES"
  | "STATS"
  | "ADVERTISING"
  | "WORKERS"
  | "SETTINGS";

/** PUBLISH: módulo de contenido (crea y publica directo) · ACCESS: módulos que no son de contenido. */
export type AccessLevel = "PUBLISH" | "ACCESS";

export type ModulePermissions = Partial<Record<Module, AccessLevel>>;

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

/** Lugar para elegir en Eventos y Directorio — PlaceOptionsController (acceso a Lugares, Eventos o Directorio). */
export interface PlaceOption {
  id: string;
  name: string;
}

/** Trabajador del panel — WorkerAdminController.WorkerResponse. */
export interface Worker {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: "ACTIVE" | "DISABLED";
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  permissions: ModulePermissions;
}

export interface CreateWorkerInput {
  email: string;
  firstName: string;
  lastName: string;
  permissions: ModulePermissions;
}

/** Sesión actual del panel — GET /api/v1/users/me (MeResponse.java). */
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  mustChangePassword: boolean;
  permissions: ModulePermissions;
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
  images: ContentImage[];
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
  images: ContentImage[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  videos: ContentVideoInput[];
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
  width: number;
  height: number;
}

/** Cuerpo de PUT /api/v1/admin/ad-placements/{id} — ver UpdateAdPlacementRequest.java. */
export interface AdPlacementUpdateInput {
  label: string;
  adsenseSlotId: string | null;
  width: number;
  height: number;
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
  amount: number | null;
  currency: string | null;
  /** 1–10: cuánto más seguido sale frente a otras campañas de la misma posición. */
  weight: number;
  targetSections: AdSection[];
  targetCategoryIds: string[];
  targetCountries: string[];
  targetRegions: string[];
}

/** Ver CampaignDailyStatResponse.java — un día (UTC) del reporte de una campaña. */
export interface CampaignDailyStat {
  day: string;
  impressions: number;
  clicks: number;
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
  amount: number | null;
  currency: string | null;
  weight: number;
  targetSections: AdSection[];
  targetCategoryIds: string[];
  targetCountries: string[];
  targetRegions: string[];
}

/** Ver PlatformStatsResponse.java (CONTEXTO.md sección 34, estadísticas básicas). */
/** Un punto del gráfico de tendencia de Estadísticas — ver DailyCountResponse.java. */
export interface DailyCount {
  date: string;
  count: number;
}

/** Me gusta y visitas totales de una fila de listado (ContentEngagementService.Counts). */
export interface EngagementCounts {
  likes: number;
  views: number;
}

/** Página de un listado de contenido del panel (AdminContentPage.java): PageResponse + engagement por id. */
export interface AdminContentPage<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  engagement: Record<string, EngagementCounts>;
}

/** Serie en el panel (SeriesDtos.SeriesResponse): incluye el estado de la sincronización con YouTube. */
export interface AdminSeries {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  categoryId: string;
  youtubePlaylistId: string;
  status: PublicationStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSeriesInput {
  playlistUrl: string;
  title?: string;
  description?: string;
  categoryId: string;
}

export interface UpdateSeriesInput {
  title?: string;
  description?: string;
  categoryId: string;
}

export interface SeriesSyncResult {
  added: number;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
}

/** Resumen del inicio del panel (GET /api/v1/admin/dashboard, ver DashboardService). */
export type DashboardRange = 7 | 30 | 90;

export interface DashboardKpi {
  current: number;
  previous: number;
}

export interface DashboardContentRow {
  type: FeedItemType;
  id: string;
  title: string;
  status: PublicationStatus;
  createdAt: string;
}

export interface DashboardSummary {
  rangeDays: DashboardRange;
  from: string;
  to: string;
  views: DashboardKpi;
  likes: DashboardKpi;
  published: DashboardKpi;
  series: { day: string; views: number; likes: number; published: number }[];
  topViewed: { type: FeedItemType; id: string; title: string; slug: string; views: number }[];
  byTypeAndStatus: Partial<Record<FeedItemType, Partial<Record<PublicationStatus, number>>>>;
  recent: DashboardContentRow[];
  /** null si el usuario no tiene el módulo de publicidad. */
  ads: { impressions: number; clicks: number; previousImpressions: number; previousClicks: number } | null;
}

export interface PlatformStats {
  articlesByStatus: Record<PublicationStatus, number>;
  articlesPublishedLast30Days: number;
  publishedTrendLast30Days: DailyCount[];
  placesByStatus: Record<PublicationStatus, number>;
  eventsByStatus: Record<PublicationStatus, number>;
  galleriesByStatus: Record<PublicationStatus, number>;
  businessesByStatus: Record<PublicationStatus, number>;
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
  /** "Antes → después" cuando la acción lo registra (p. ej. permisos de un trabajador). */
  details: string | null;
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

// Tipos que reflejan los DTOs del backend (ver
// backend/src/main/java/pe/plataformacontenidos/content/api/dto/*).
// Mantener sincronizados a mano por ahora; si esto crece, considerar
// generarlos desde una spec OpenAPI.

/** Formato de publicación (plataforma de contenido, no géneros periodísticos — ver V48 en el backend). */
export type ArticleType = "GENERAL" | "GUIA" | "LISTA" | "TUTORIAL" | "HISTORIA";

/** Estado de cualquier contenido — shared.publishing.PublicationStatus (spec 2026-10-07 §1). */
export type PublicationStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

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

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  articleType: ArticleType;
  status: PublicationStatus;
  authorId: string;
  categoryId: string;
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  images: ContentImage[];
  videos: ContentVideo[];
  robots: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
}

/** Ver SearchResultResponse.java (CONTEXTO.md sección 16) — resultado unificado de todos los tipos buscables. */
export type SearchResultType = "ARTICLE" | "PLACE" | "EVENT" | "GALLERY" | "BUSINESS" | "EPISODE";

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
  /** Solo Episodio: la URL es /series/{seriesSlug}/{slug}. */
  seriesSlug: string | null;
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
  status: PublicationStatus;
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
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  likeCount: number;
}

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
  /** Celebración que se repite cada año; false = única (spec 2026-10-16). */
  recursYearly: boolean;
  allDay: boolean;
  sinceYear: number | null;
  /** Dónde se celebra: país ISO-2 («PE»); null = en todo el mundo. */
  scopeCountry: string | null;
  /** Región de ese país («Ayacucho»); null = todo el país. */
  scopeRegion: string | null;
  /** Próxima vez que toca (lo que se muestra y ordena Celebraciones). */
  nextOccurrenceAt: string;
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
  status: PublicationStatus;
  authorId: string;
  categoryId: string;
  placeId: string | null;
  venueName: string | null;
  startsAt: string;
  endsAt: string | null;
  /** Celebración que se repite cada año; false = única (spec 2026-10-16). */
  recursYearly: boolean;
  allDay: boolean;
  sinceYear: number | null;
  /** Dónde se celebra: país ISO-2 («PE»); null = en todo el mundo. */
  scopeCountry: string | null;
  /** Región de ese país («Ayacucho»); null = todo el país. */
  scopeRegion: string | null;
  /** Próxima vez que toca (lo que se muestra y ordena Celebraciones). */
  nextOccurrenceAt: string;
  images: ContentImage[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  videos: ContentVideo[];
  robots: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  likeCount: number;
}

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
  status: PublicationStatus;
  authorId: string;
  categoryId: string;
  images: ContentImage[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  robots: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  likeCount: number;
}

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
  status: PublicationStatus;
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
  /** País del sitio (ISO-2): qué celebraciones ve quien llega sin ubicación conocida. */
  homeCountry: string;
}

/** Ver AdPlacementResponse.java — posición de anuncio configurable (CONTEXTO.md sección 43.2). */
export interface AdPlacement {
  id: string;
  key: string;
  label: string;
  adsenseSlotId: string | null;
  enabled: boolean;
  /** Medida de la creatividad en px CSS (tamaño estándar IAB): se muestra entera, nunca recortada. */
  width: number;
  height: number;
}

export type CampaignFormat = "BANNER" | "NATIVE";

/** Botón del anuncio nativo (CallToAction.java); textos en lib/ads/call-to-action.ts. */
export type CallToAction = "LEARN_MORE" | "SHOP_NOW" | "BOOK" | "ORDER" | "WHATSAPP" | "SIGN_UP";

/** Proporción del medio de un anuncio nativo (CampaignService). */
export type NativeMediaAspect = "1:1" | "4:5" | "1.91:1" | "16:9" | "9:16";

/** Campos del anuncio nativo (null en un banner) — ver ActiveCampaignResponse.java. */
interface NativeAdFields {
  advertiserName: string | null;
  primaryText: string | null;
  headline: string | null;
  callToAction: CallToAction | null;
  /** Solo el dominio del destino («polleriaelinca.pe»): el link real nunca llega al navegador. */
  displayDomain: string | null;
  youtubeVideoId: string | null;
  mediaAspect: NativeMediaAspect | null;
}

/** Ver ActiveCampaignResponse.java — nunca trae el link real, solo `id` para armar el link de clic. */
export interface ActiveCampaign extends NativeAdFields {
  id: string;
  advertiserId: string;
  format: CampaignFormat;
  imageId: string | null;
  externalImageUrl: string | null;
  imageAlt: string | null;
  advertiserLogoImageId: string | null;
}

/**
 * ActiveCampaign con las imágenes ya resueltas para next/image (ver
 * app/api/ads/campaign/route.ts) — la forma que recibe el navegador.
 */
export interface ResolvedCampaign extends NativeAdFields {
  id: string;
  advertiserId: string;
  format: CampaignFormat;
  imageSrc: string | null;
  externalImageUrl: string | null;
  imageAlt: string | null;
  advertiserLogoSrc: string | null;
}

/** Ver PlacementRotationResponse.java: medida de la posición + campañas en el orden a asignar. */
export interface PlacementRotation {
  width: number;
  height: number;
  campaigns: ActiveCampaign[];
}

export interface ResolvedRotation {
  width: number;
  height: number;
  campaigns: ResolvedCampaign[];
}

/** Ver FeedItemResponse.java — feed unificado del home y "relacionados" de la vista de detalle. */
export type FeedItemType = "ARTICLE" | "PLACE" | "EVENT" | "GALLERY" | "BUSINESS" | "EPISODE";

/** Una imagen del carrusel de un ítem del feed: subida (`imageId`) o por enlace externo, nunca ambas. */
export interface FeedImage {
  imageId: string | null;
  externalUrl: string | null;
}

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
  /** Carrusel (hasta 10). */
  images: FeedImage[];
  /** Solo eventos. */
  startsAt: string | null;
  /** Lugares y directorio. */
  latitude: number | null;
  longitude: number | null;
  /** Solo directorio. */
  phone: string | null;
  website: string | null;
  /** Solo episodios: la URL es /series/{seriesSlug}/{slug}. */
  seriesSlug: string | null;
  seriesTitle: string | null;
  youtubeVideoId: string | null;
  /** Solo celebraciones: todo el día y si se repite cada año (`startsAt` = la próxima vez). */
  allDay: boolean | null;
  recursYearly: boolean | null;
}

/** Ver FeedTopicResponse.java — un círculo de la fila de temas. */
export interface FeedTopic {
  categoryId: string;
  name: string;
  slug: string;
  coverImageId: string | null;
  coverImageUrl: string | null;
  hasNew: boolean;
}

/** Ver FeedPageResponse.java. `hasMore` indica si queda contenido sin mostrar dado lo ya excluido. */
export interface FeedPage {
  items: FeedItem[];
  hasMore: boolean;
}

/** Serie pública (SeriesDtos.PublicSeriesResponse): un programa que se transmite en YouTube. */
export interface SeriesSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  categoryId: string;
  /** Arte del programa; null = se usa la miniatura del último episodio. */
  coverImageId: string | null;
  youtubePlaylistId: string;
  publishedAt: string | null;
}

/** Episodio (SeriesDtos.EpisodeResponse): un video de YouTube, solo su id. */
export interface Episode {
  id: string;
  slug: string;
  youtubeVideoId: string;
  title: string;
  description: string | null;
  /** Texto propio del equipo (HTML saneado en el backend). */
  notes: string | null;
  publishedAt: string;
  status: "PUBLISHED" | "ARCHIVED";
}

/** Portada del listado de series: cuántos episodios y el último (su miniatura es la portada). */
export interface SeriesCard {
  series: SeriesSummary;
  episodeCount: number;
  latestEpisode: Episode | null;
}

/** Página de un episodio, con sus vecinos para "siguiente / anterior". */
export interface EpisodeView {
  series: SeriesSummary;
  episode: Episode;
  newer: Episode | null;
  older: Episode | null;
  likeCount: number;
}

/** Transmisión en vivo de YouTube (LiveDtos.LiveResponse). El estado lo marca el equipo en el panel. */
export type LiveStatus = "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";

export interface LiveStream {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  youtubeVideoId: string;
  categoryId: string;
  seriesId: string | null;
  status: LiveStatus;
  scheduledStart: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

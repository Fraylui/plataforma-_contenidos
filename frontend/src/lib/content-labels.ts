import type { ArticleType, BusinessType, SearchResultType, PublicationStatus } from "@/lib/api/types";
import type { BadgeTone } from "@/components/ui";

const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  GENERAL: "General",
  GUIA: "Guía",
  LISTA: "Lista",
  TUTORIAL: "Tutorial",
  HISTORIA: "Historia",
  ENTREVISTA: "Entrevista",
};

export function articleTypeLabel(type: ArticleType): string {
  return ARTICLE_TYPE_LABELS[type];
}

const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, string> = {
  DRAFT: "Borrador",
  IN_REVIEW: "Pendiente de aprobación",
  SCHEDULED: "Programado",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};

export function publicationStatusLabel(status: PublicationStatus): string {
  return PUBLICATION_STATUS_LABELS[status];
}

// Color de la etiqueta de estado (Badge) — backend: shared.publishing.PublicationStatus.
const PUBLICATION_STATUS_TONE: Record<PublicationStatus, BadgeTone> = {
  DRAFT: "neutral",
  IN_REVIEW: "info",
  SCHEDULED: "warning",
  PUBLISHED: "success",
  ARCHIVED: "neutral",
};

export function publicationStatusTone(status: PublicationStatus): BadgeTone {
  return PUBLICATION_STATUS_TONE[status];
}

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  RESTAURANT: "Restaurante",
  HOTEL: "Hotel",
  SERVICE: "Servicio",
  SHOP: "Tienda",
  OTHER: "Otro",
};

export function businessTypeLabel(type: BusinessType): string {
  return BUSINESS_TYPE_LABELS[type];
}

/** "ARTICLE_PUBLISHED" -> "Article published" — sin diccionario por código de auditoría (docenas de valores, ver AuditService.record en el backend), solo legible. */
export function humanizeAuditAction(action: string): string {
  const words = action.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatPublishedDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Fecha de publicación de Artículo: tiempo relativo que se extiende
 * indefinidamente (segundos→minutos→horas→días→meses→años), nunca fecha
 * absoluta, nunca vacío — mismo patrón que usan YouTube/Reddit/GitHub, a
 * pedido explícito del usuario tras comparar con otros sitios grandes.
 * Solo para Artículo: es el único tipo de contenido donde "qué tan
 * reciente es" sigue siendo la señal relevante después de publicado (a
 * diferencia de Lugar/Galería, atemporales, o Evento, donde la fecha es
 * de agenda, no de antigüedad — ver formatEventDateTime).
 */
export function formatArticleDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return "justo ahora";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `hace ${diffDays} d`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `hace ${diffMonths} mes${diffMonths === 1 ? "" : "es"}`;
  const diffYears = Math.floor(diffMonths / 12);
  return `hace ${diffYears} año${diffYears === 1 ? "" : "s"}`;
}

/**
 * Fecha corta absoluta ("sáb 29 ago 2026") para Lugar/Galería en el
 * home: contenido atemporal donde "hace 3 meses" no aporta (ver
 * formatArticleDate, que sí es relativa a propósito para Publicaciones).
 */
export function formatShortDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Fecha y hora de un Evento — siempre absoluta ("vie 12 dic, 7:00 p. m."),
 * nunca relativa ("hace 3 días", "en 5 horas"): a diferencia de la fecha de
 * publicación de Artículo/Lugar (un dato secundario de "qué tan viejo es
 * esto"), la fecha de un evento es información que el usuario necesita para
 * decidir si asiste — mismo criterio que usan Eventbrite/Meetup/Atlas
 * Obscura.
 */
export function formatEventDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Un evento se considera finalizado cuando pasó endsAt (o startsAt si no tiene hora de fin). */
// Ver SearchResultResponse.java (CONTEXTO.md sección 16) — un solo lugar para
// la etiqueta y la ruta de cada tipo buscable (buscador con sugerencias en vivo).
const SEARCH_RESULT_TYPE_LABEL: Record<SearchResultType, string> = {
  ARTICLE: "Publicación",
  PLACE: "Lugar",
  EVENT: "Evento",
  GALLERY: "Galería",
  BUSINESS: "Directorio",
};

export function searchResultTypeLabel(type: SearchResultType): string {
  return SEARCH_RESULT_TYPE_LABEL[type];
}

const SEARCH_RESULT_TYPE_PATH: Record<SearchResultType, string> = {
  ARTICLE: "publicaciones",
  PLACE: "lugares",
  EVENT: "eventos",
  GALLERY: "galerias",
  BUSINESS: "directorio",
};

export function searchResultHref(type: SearchResultType, slug: string): string {
  return `/${SEARCH_RESULT_TYPE_PATH[type]}/${slug}`;
}

export function isEventFinished(event: { startsAt: string; endsAt: string | null }): boolean {
  const reference = event.endsAt ?? event.startsAt;
  return new Date(reference).getTime() < Date.now();
}

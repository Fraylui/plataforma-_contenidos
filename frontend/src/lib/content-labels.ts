import type { ArticleStatus, ArticleType, BusinessType, GeographyLevel } from "@/lib/api/types";

const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  ARTICULO: "Artículo",
  NOTICIA: "Noticia",
  REPORTAJE: "Reportaje",
  CRONICA: "Crónica",
  GUIA: "Guía",
  ENTREVISTA: "Entrevista",
  HISTORIA: "Historia",
  RANKING: "Ranking",
  TUTORIAL: "Tutorial",
  OPINION: "Opinión",
};

export function articleTypeLabel(type: ArticleType): string {
  return ARTICLE_TYPE_LABELS[type];
}

const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: "Borrador",
  IN_REVIEW: "En revisión",
  APPROVED: "Aprobado",
  SCHEDULED: "Programado",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
  REJECTED: "Rechazado",
};

export function articleStatusLabel(status: ArticleStatus): string {
  return ARTICLE_STATUS_LABELS[status];
}

// Tono del badge de estado en el panel admin — ver ArticleStatus (backend:
// ArticleStatus.java, sección 12 de CONTEXTO.md).
const ARTICLE_STATUS_TONE: Record<ArticleStatus, "neutral" | "warning" | "success" | "danger"> = {
  DRAFT: "neutral",
  IN_REVIEW: "warning",
  APPROVED: "warning",
  SCHEDULED: "warning",
  PUBLISHED: "success",
  ARCHIVED: "neutral",
  REJECTED: "danger",
};

export function articleStatusTone(status: ArticleStatus): "neutral" | "warning" | "success" | "danger" {
  return ARTICLE_STATUS_TONE[status];
}

const GEOGRAPHY_LEVEL_LABELS: Record<GeographyLevel, string> = {
  PAIS: "País",
  REGION: "Región",
  PROVINCIA: "Provincia",
  DISTRITO: "Distrito",
  LOCALIDAD: "Localidad",
};

export function geographyLevelLabel(level: GeographyLevel): string {
  return GEOGRAPHY_LEVEL_LABELS[level];
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
export function isEventFinished(event: { startsAt: string; endsAt: string | null }): boolean {
  const reference = event.endsAt ?? event.startsAt;
  return new Date(reference).getTime() < Date.now();
}

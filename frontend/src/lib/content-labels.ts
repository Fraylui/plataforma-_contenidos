import type { ArticleStatus, ArticleType, GeographyLevel } from "@/lib/api/types";

const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  ARTICULO: "Artículo",
  NOTICIA: "Noticia",
  REPORTAJE: "Reportaje",
  CRONICA: "Crónica",
  GUIA: "Guía",
  ENTREVISTA: "Entrevista",
  HISTORIA: "Historia",
  RANKING: "Ranking",
  RESENA: "Reseña",
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

export function formatPublishedDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "long",
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

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

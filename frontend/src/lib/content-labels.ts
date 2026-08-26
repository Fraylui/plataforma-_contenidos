import type { ArticleType } from "@/lib/api/types";

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

export function formatPublishedDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

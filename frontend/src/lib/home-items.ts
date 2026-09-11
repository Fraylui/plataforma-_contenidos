import "server-only";
import type { ArticleSummary, EventSummary, GallerySummary, PlaceSummary, ReviewSummary } from "@/lib/api/types";
import { articleTypeLabel, formatArticleDate, formatEventDateTime, formatShortDate } from "@/lib/content-labels";
import { serverImageUrl } from "@/lib/server-image-url";
import type { LikeableContentType } from "@/components/content/like-share-bar";

export type HomeItemKind = "publicacion" | "lugar" | "evento" | "galeria" | "resena";

/**
 * Forma común de los 5 tipos de contenido para el home: la portada mezcla
 * Publicaciones, Lugares, Eventos, Galerías y Reseñas en las mismas
 * tarjetas, así que el home no debería conocer 5 DTOs distintos. Todo lo
 * que necesita un Client Component (hero, categoría en foco) viene ya
 * resuelto acá en el servidor: URL de imagen, etiquetas, fechas formateadas.
 */
export interface HomeItem {
  id: string;
  kind: HomeItemKind;
  slug: string;
  href: string;
  likeCount: number;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  categoryId: string;
  /** Etiqueta del tipo que va sobre la imagen ("Crónica", "Lugar", "Galería"…). */
  typeLabel: string;
  /** ISO usado para ordenar "Lo nuevo" (publishedAt, o startsAt en Evento). */
  sortDate: string;
  /** Texto de fecha ya formateado según la regla de cada tipo (ver content-labels.ts). */
  dateLabel: string;
}

const KIND_LABEL: Record<HomeItemKind, string> = {
  publicacion: "Publicación",
  lugar: "Lugar",
  evento: "Evento",
  galeria: "Galería",
  resena: "Reseña",
};

export function homeKindLabel(kind: HomeItemKind): string {
  return KIND_LABEL[kind];
}

const LIKE_TYPE: Record<HomeItemKind, LikeableContentType> = {
  publicacion: "articles",
  lugar: "places",
  evento: "events",
  galeria: "galleries",
  resena: "reviews",
};

/** Tipo de contenido para el endpoint de "me gusta" (ver like-share-bar.tsx). */
export function homeLikeType(kind: HomeItemKind): LikeableContentType {
  return LIKE_TYPE[kind];
}

function image(id: string | null | undefined): string | null {
  return id ? serverImageUrl(`/api/v1/images/${id}/file`) : null;
}

export function fromArticle(a: ArticleSummary): HomeItem {
  return {
    id: a.id,
    kind: "publicacion",
    slug: a.slug,
    likeCount: a.likeCount,
    href: `/publicaciones/${a.slug}`,
    title: a.title,
    excerpt: a.excerpt,
    imageUrl: image(a.featuredImageId),
    categoryId: a.categoryId,
    typeLabel: articleTypeLabel(a.articleType),
    sortDate: a.publishedAt ?? "",
    dateLabel: formatArticleDate(a.publishedAt),
  };
}

export function fromPlace(p: PlaceSummary): HomeItem {
  return {
    id: p.id,
    kind: "lugar",
    slug: p.slug,
    likeCount: p.likeCount,
    href: `/lugares/${p.slug}`,
    title: p.name,
    excerpt: p.excerpt,
    imageUrl: image(p.coverImageId),
    categoryId: p.categoryId,
    typeLabel: KIND_LABEL.lugar,
    sortDate: p.publishedAt ?? "",
    dateLabel: formatShortDate(p.publishedAt),
  };
}

export function fromEvent(e: EventSummary): HomeItem {
  return {
    id: e.id,
    kind: "evento",
    slug: e.slug,
    likeCount: e.likeCount,
    href: `/eventos/${e.slug}`,
    title: e.title,
    excerpt: e.excerpt,
    imageUrl: image(e.coverImageId),
    categoryId: e.categoryId,
    typeLabel: KIND_LABEL.evento,
    sortDate: e.startsAt,
    dateLabel: formatEventDateTime(e.startsAt),
  };
}

export function fromGallery(g: GallerySummary): HomeItem {
  return {
    id: g.id,
    kind: "galeria",
    slug: g.slug,
    likeCount: g.likeCount,
    href: `/galerias/${g.slug}`,
    title: g.title,
    excerpt: g.excerpt,
    imageUrl: image(g.imageIds[0]),
    categoryId: g.categoryId,
    typeLabel: KIND_LABEL.galeria,
    sortDate: g.publishedAt ?? "",
    dateLabel: formatShortDate(g.publishedAt),
  };
}

export function fromReview(r: ReviewSummary): HomeItem {
  return {
    id: r.id,
    kind: "resena",
    slug: r.slug,
    likeCount: r.likeCount,
    href: `/resenas/${r.slug}`,
    title: r.title,
    excerpt: r.excerpt,
    imageUrl: image(r.coverImageId),
    categoryId: r.categoryId,
    typeLabel: KIND_LABEL.resena,
    sortDate: r.publishedAt ?? "",
    dateLabel: formatShortDate(r.publishedAt),
  };
}

/** Más nuevo primero; los que no tienen fecha van al final. */
export function sortNewestFirst(items: HomeItem[]): HomeItem[] {
  return [...items].sort((a, b) => (b.sortDate || "").localeCompare(a.sortDate || ""));
}

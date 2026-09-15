import "server-only";
import type { ArticleSummary, EventSummary, FeedItem, GallerySummary, PlaceSummary } from "@/lib/api/types";
import { articleTypeLabel, formatArticleDate, formatEventDateTime, formatShortDate } from "@/lib/content-labels";
import { serverImageUrl } from "@/lib/server-image-url";
import { KIND_LABEL, type HomeItemKind } from "@/lib/content-kind";

export type { HomeItemKind };

/**
 * Forma común de los tipos de contenido para el home: la portada mezcla
 * Publicaciones, Lugares, Eventos y Galerías en las mismas
 * tarjetas, así que el home no debería conocer varios DTOs distintos. Todo lo
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

function image(id: string | null | undefined): string | null {
  return id ? serverImageUrl(`/api/v1/images/${id}/file`) : null;
}

/** Portada de Publicación/Lugar/Evento: subida (coverImageId) o por enlace externo (coverImageUrl), nunca ambas. */
function coverImage(imageId: string | null, imageUrl: string | null): string | null {
  return imageId ? image(imageId) : imageUrl;
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
    imageUrl: coverImage(a.coverImageId, a.coverImageUrl),
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
    imageUrl: coverImage(p.coverImageId, p.coverImageUrl),
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
    imageUrl: coverImage(e.coverImageId, e.coverImageUrl),
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

const FEED_KIND: Record<FeedItem["type"], HomeItemKind> = {
  ARTICLE: "publicacion",
  PLACE: "lugar",
  EVENT: "evento",
};

const FEED_HREF_PREFIX: Record<HomeItemKind, string> = {
  publicacion: "/publicaciones",
  lugar: "/lugares",
  evento: "/eventos",
  galeria: "/galerias",
};

/**
 * Ítem del feed unificado (home con scroll infinito + relacionados de la
 * vista de detalle, ver FeedController en el backend). Se usa tanto desde
 * el Server Component del home (primer lote) como desde api/feed/route.ts
 * (que sí puede importar "server-only": un route handler nunca se manda al
 * navegador) — el navegador nunca ve un featuredImageId/coverImageId
 * crudo, solo la URL ya resuelta.
 */
export function fromFeedItem(item: FeedItem): HomeItem {
  const kind = FEED_KIND[item.type];
  return {
    id: item.id,
    kind,
    slug: item.slug,
    href: `${FEED_HREF_PREFIX[kind]}/${item.slug}`,
    likeCount: item.likeCount,
    title: item.title,
    excerpt: item.excerpt,
    imageUrl: coverImage(item.coverImageId, item.coverImageUrl),
    categoryId: item.categoryId ?? "",
    typeLabel: item.articleType ? articleTypeLabel(item.articleType) : KIND_LABEL[kind],
    sortDate: item.publishedAt ?? "",
    dateLabel: "",
  };
}

/** Más nuevo primero; los que no tienen fecha van al final. */
export function sortNewestFirst(items: HomeItem[]): HomeItem[] {
  return [...items].sort((a, b) => (b.sortDate || "").localeCompare(a.sortDate || ""));
}

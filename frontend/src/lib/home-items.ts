import "server-only";
import type { FeedItem, SearchResult } from "@/lib/api/types";
import { formatEventDateTime } from "@/lib/content-labels";
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
  /** true = enlace externo pegado por quien redacta (host arbitrario, nunca pasa por next/image); false/undefined = imagen subida a Medios. */
  imageIsExternal: boolean;
  categoryId: string;
  /** Etiqueta del tipo ("Publicación", "Lugar", "Galería"…). */
  typeLabel: string;
  /** ISO usado para ordenar "Lo nuevo" (publishedAt, o startsAt en Evento). */
  sortDate: string;
  /** Texto de fecha ya formateado según la regla de cada tipo (ver content-labels.ts). */
  dateLabel: string;
  /** Carrusel de la tarjeta tipo post; la primera es la portada. Vacío si no hay imágenes. */
  images: HomeImage[];
  /** Tiene video (ícono en la cuadrícula de Explorar). */
  hasVideo?: boolean;
  /** Acciones por tipo (Agendar, Cómo llegar, Llamar, Sitio web); null si no aplican. */
  startsAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  website?: string | null;
}

export interface HomeImage {
  url: string;
  isExternal: boolean;
}

/** La portada como carrusel de una sola imagen (listados que no traen la galería completa). */
function coverAsImages(cover: { url: string | null; isExternal: boolean }): HomeImage[] {
  return cover.url ? [{ url: cover.url, isExternal: cover.isExternal }] : [];
}

function image(id: string | null | undefined): string | null {
  return id ? serverImageUrl(`/api/v1/images/${id}/file`) : null;
}

/**
 * Portada de Publicación/Lugar/Evento: subida (coverImageId) o por enlace
 * externo (coverImageUrl), nunca ambas — el `isExternal` que devuelve es lo
 * que le dice a cada Cover si puede pasar por next/image (host propio,
 * allowlisteado) o si tiene que ser un <img> plano (host arbitrario, ver
 * next.config.ts remotePatterns).
 */
function coverImage(imageId: string | null, imageUrl: string | null): { url: string | null; isExternal: boolean } {
  return imageId ? { url: image(imageId), isExternal: false } : { url: imageUrl, isExternal: imageUrl != null };
}

const FEED_KIND: Record<FeedItem["type"], HomeItemKind> = {
  ARTICLE: "publicacion",
  PLACE: "lugar",
  EVENT: "evento",
  GALLERY: "galeria",
  BUSINESS: "directorio",
};

const FEED_HREF_PREFIX: Record<HomeItemKind, string> = {
  publicacion: "/publicaciones",
  lugar: "/lugares",
  evento: "/eventos",
  galeria: "/galerias",
  directorio: "/directorio",
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
  const cover = coverImage(item.coverImageId, item.coverImageUrl);
  const images = (item.images ?? []).flatMap((i) => coverAsImages(coverImage(i.imageId, i.externalUrl)));
  return {
    id: item.id,
    kind,
    slug: item.slug,
    href: `${FEED_HREF_PREFIX[kind]}/${item.slug}`,
    likeCount: item.likeCount,
    title: item.title,
    excerpt: item.excerpt,
    imageUrl: cover.url,
    imageIsExternal: cover.isExternal,
    categoryId: item.categoryId ?? "",
    typeLabel: KIND_LABEL[kind],
    // En la agenda importa cuándo es el evento, no cuándo se publicó.
    sortDate: (item.type === "EVENT" ? item.startsAt : item.publishedAt) ?? "",
    dateLabel: item.type === "EVENT" && item.startsAt ? formatEventDateTime(item.startsAt) : "",
    images: images.length > 0 ? images : coverAsImages(cover),
    hasVideo: item.hasVideo,
    startsAt: item.startsAt,
    latitude: item.latitude,
    longitude: item.longitude,
    phone: item.phone,
    website: item.website,
  };
}

/**
 * Resultado de búsqueda como miniatura de cuadrícula (GridTile), igual que
 * Explorar. La búsqueda no trae "me gusta": likeCount 0 (GridTile no muestra
 * el conteo en 0).
 */
export function fromSearchResult(r: SearchResult): HomeItem {
  const kind = FEED_KIND[r.contentType];
  const cover = coverImage(r.featuredImageId, r.featuredImageUrl);
  return {
    id: r.id,
    kind,
    slug: r.slug,
    href: `${FEED_HREF_PREFIX[kind]}/${r.slug}`,
    likeCount: 0,
    title: r.title,
    excerpt: r.excerpt,
    imageUrl: cover.url,
    imageIsExternal: cover.isExternal,
    categoryId: r.categoryId ?? "",
    typeLabel: KIND_LABEL[kind],
    sortDate: (r.contentType === "EVENT" ? r.eventStartsAt : r.publishedAt) ?? "",
    dateLabel: r.contentType === "EVENT" && r.eventStartsAt ? formatEventDateTime(r.eventStartsAt) : "",
    images: coverAsImages(cover),
    hasVideo: r.hasVideo,
    startsAt: r.eventStartsAt,
  };
}


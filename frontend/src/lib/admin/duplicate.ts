import type { GalleryInput, PlaceInput, PublicationInput } from "@/lib/api/admin-types";
import type { Gallery, Place, Publication } from "@/lib/api/types";
import { videosFromContent } from "@/components/admin/composer/schema";

const MAX_TITLE = 200;

/** «Copia de …» sin pasarse del largo máximo del título. */
export function copyTitle(title: string): string {
  return `Copia de ${title}`.slice(0, MAX_TITLE);
}

/*
 * Duplicar = empezar un borrador nuevo con todo lo del original: texto,
 * fotos, videos y tema. No se copian canonical ni la imagen para compartir
 * propia (apuntarían al original) ni nada del estado: la copia nace borrador.
 */

export function publicationCopy(p: Publication): PublicationInput {
  return {
    title: copyTitle(p.title),
    excerpt: p.excerpt,
    body: p.body,
    publicationType: p.publicationType,
    categoryId: p.categoryId,
    seoTitle: null,
    metaDescription: p.metaDescription,
    canonicalUrl: null,
    ogImageUrl: null,
    images: p.images,
    videos: videosFromContent(p.videos),
    robots: p.robots,
    sources: p.sources ?? [],
  };
}

export function placeCopy(p: Place): PlaceInput {
  return {
    name: copyTitle(p.name),
    excerpt: p.excerpt,
    body: p.body,
    categoryId: p.categoryId,
    latitude: p.latitude,
    longitude: p.longitude,
    region: (p.region as PlaceInput["region"]) ?? null,
    country: p.country ?? null,
    images: p.images,
    seoTitle: null,
    metaDescription: p.metaDescription,
    canonicalUrl: null,
    ogImageUrl: null,
    videos: videosFromContent(p.videos),
    robots: p.robots,
    sources: p.sources ?? [],
  };
}

export function galleryCopy(g: Gallery): GalleryInput {
  return {
    title: copyTitle(g.title),
    excerpt: g.excerpt,
    categoryId: g.categoryId,
    images: g.images,
    seoTitle: null,
    metaDescription: g.metaDescription,
    canonicalUrl: null,
    ogImageUrl: null,
    robots: g.robots,
  };
}

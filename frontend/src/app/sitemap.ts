import type { MetadataRoute } from "next";
import {
  listActiveCategories,
  listAllPublishedPublicationsForSitemap,
  listAllPublishedBusinessesForSitemap,
  listAllPublishedCelebrationsForSitemap,
  listAllPublishedGalleriesForSitemap,
  listAllPublishedPlacesForSitemap,
  listAllSeriesWithEpisodesForSitemap,
} from "@/lib/api/client";
import { SITE_URL } from "@/lib/site-url";
import { isCelebrationFinished } from "@/lib/content-labels";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [publications, places, celebrations, galleries, businesses, categories, series] = await Promise.all([
    listAllPublishedPublicationsForSitemap(),
    listAllPublishedPlacesForSitemap(),
    listAllPublishedCelebrationsForSitemap(),
    listAllPublishedGalleriesForSitemap(),
    listAllPublishedBusinessesForSitemap(),
    listActiveCategories(),
    listAllSeriesWithEpisodesForSitemap(),
  ]);

  // Series y episodios: cada episodio es una página propia con su video (VideoObject).
  const seriesEntries: MetadataRoute.Sitemap = series.flatMap(({ series: s, episodes }) => [
    { url: `${SITE_URL}/series/${s.slug}`, changeFrequency: "weekly" as const, priority: 0.6 },
    ...episodes.map((episode) => ({
      url: `${SITE_URL}/series/${s.slug}/${episode.slug}`,
      lastModified: episode.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ]);

  const publicationEntries: MetadataRoute.Sitemap = publications.map((publication) => ({
    url: `${SITE_URL}/publicaciones/${publication.slug}`,
    lastModified: publication.publishedAt ?? undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const placeEntries: MetadataRoute.Sitemap = places.map((place) => ({
    url: `${SITE_URL}/lugares/${place.slug}`,
    lastModified: place.publishedAt ?? undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const celebrationEntries: MetadataRoute.Sitemap = celebrations.map((celebration) => {
    const finished = isCelebrationFinished(celebration);
    return {
      url: `${SITE_URL}/celebraciones/${celebration.slug}`,
      // Un evento pasado ya no cambia y ya no es prioridad de rastreo (crawl
      // budget mejor gastado en próximos/nuevos) — sigue indexado, solo baja.
      changeFrequency: finished ? "yearly" : "weekly",
      priority: finished ? 0.3 : 0.5,
    };
  });

  const galleryEntries: MetadataRoute.Sitemap = galleries.map((gallery) => ({
    url: `${SITE_URL}/galerias/${gallery.slug}`,
    lastModified: gallery.publishedAt ?? undefined,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const businessEntries: MetadataRoute.Sitemap = businesses.map((business) => ({
    url: `${SITE_URL}/directorio/${business.slug}`,
    lastModified: business.publishedAt ?? undefined,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/categorias/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/publicaciones`,
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/celebraciones`,
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/galerias`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/series`,
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/directorio`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...publicationEntries,
    ...placeEntries,
    ...celebrationEntries,
    ...galleryEntries,
    ...businessEntries,
    ...categoryEntries,
    ...seriesEntries,
    {
      url: `${SITE_URL}/privacidad`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terminos`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/contacto`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}

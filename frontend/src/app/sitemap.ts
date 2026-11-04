import type { MetadataRoute } from "next";
import {
  listActiveCategories,
  listAllPublishedArticlesForSitemap,
  listAllPublishedBusinessesForSitemap,
  listAllPublishedEventsForSitemap,
  listAllPublishedGalleriesForSitemap,
  listAllPublishedPlacesForSitemap,
  getPrimaryNavVisibility,
} from "@/lib/api/client";
import { SITE_URL } from "@/lib/site-url";
import { isEventFinished } from "@/lib/content-labels";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, places, events, galleries, businesses, categories, visibility] = await Promise.all([
    listAllPublishedArticlesForSitemap(),
    listAllPublishedPlacesForSitemap(),
    listAllPublishedEventsForSitemap(),
    listAllPublishedGalleriesForSitemap(),
    listAllPublishedBusinessesForSitemap(),
    listActiveCategories(),
    getPrimaryNavVisibility(),
  ]);

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/publicaciones/${article.slug}`,
    lastModified: article.publishedAt ?? undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const placeEntries: MetadataRoute.Sitemap = places.map((place) => ({
    url: `${SITE_URL}/lugares/${place.slug}`,
    lastModified: place.publishedAt ?? undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const eventEntries: MetadataRoute.Sitemap = events.map((event) => {
    const finished = isEventFinished(event);
    return {
      url: `${SITE_URL}/eventos/${event.slug}`,
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

  // Páginas de módulo: solo las que tienen contenido (las vacías dan 404, CONTEXTO.md 43.5).
  const MODULES: { path: string; changeFrequency: "daily" | "weekly"; priority: number }[] = [
    { path: "/publicaciones", changeFrequency: "daily", priority: 0.6 },
    { path: "/lugares", changeFrequency: "weekly", priority: 0.6 },
    { path: "/eventos", changeFrequency: "daily", priority: 0.6 },
    { path: "/galerias", changeFrequency: "weekly", priority: 0.5 },
    { path: "/directorio", changeFrequency: "weekly", priority: 0.5 },
  ];
  const moduleEntries: MetadataRoute.Sitemap = MODULES.filter((m) => visibility[m.path]).map((m) => ({
    url: `${SITE_URL}${m.path}`,
    changeFrequency: m.changeFrequency,
    priority: m.priority,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...moduleEntries,
    ...articleEntries,
    ...placeEntries,
    ...eventEntries,
    ...galleryEntries,
    ...businessEntries,
    ...categoryEntries,
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

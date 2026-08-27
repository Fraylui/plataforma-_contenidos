import type { MetadataRoute } from "next";
import {
  listActiveCategories,
  listAllPublishedArticlesForSitemap,
  listAllPublishedPlacesForSitemap,
} from "@/lib/api/client";
import { SITE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, places, categories] = await Promise.all([
    listAllPublishedArticlesForSitemap(),
    listAllPublishedPlacesForSitemap(),
    listActiveCategories(),
  ]);

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/articulos/${article.slug}`,
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
      url: `${SITE_URL}/articulos`,
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/categorias`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...articleEntries,
    ...placeEntries,
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
  ];
}

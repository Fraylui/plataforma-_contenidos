import type { MetadataRoute } from "next";
import {
  listActiveCategories,
  listAllPublishedArticlesForSitemap,
  listAllPublishedBusinessesForSitemap,
  listAllPublishedEventsForSitemap,
  listAllPublishedGalleriesForSitemap,
  listAllPublishedPlacesForSitemap,
  listAllPublishedReviewsForSitemap,
} from "@/lib/api/client";
import { SITE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, places, events, galleries, reviews, businesses, categories] = await Promise.all([
    listAllPublishedArticlesForSitemap(),
    listAllPublishedPlacesForSitemap(),
    listAllPublishedEventsForSitemap(),
    listAllPublishedGalleriesForSitemap(),
    listAllPublishedReviewsForSitemap(),
    listAllPublishedBusinessesForSitemap(),
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

  const eventEntries: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${SITE_URL}/eventos/${event.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const galleryEntries: MetadataRoute.Sitemap = galleries.map((gallery) => ({
    url: `${SITE_URL}/galerias/${gallery.slug}`,
    lastModified: gallery.publishedAt ?? undefined,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const reviewEntries: MetadataRoute.Sitemap = reviews.map((review) => ({
    url: `${SITE_URL}/resenas/${review.slug}`,
    lastModified: review.publishedAt ?? undefined,
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
      url: `${SITE_URL}/articulos`,
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/eventos`,
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/galerias`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/resenas`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/directorio`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/categorias`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...articleEntries,
    ...placeEntries,
    ...eventEntries,
    ...galleryEntries,
    ...reviewEntries,
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
  ];
}

import { getPlatformSettings, listPublishedArticles } from "@/lib/api/client";
import { SITE_URL } from "@/lib/site-url";
import { imageUrl } from "@/lib/image-url";

const FEED_SIZE = 30;

/**
 * RSS 2.0 de Publicaciones (no de los otros 4 tipos de contenido: es la
 * sección de Publicaciones del sitio, el contenido narrativo más largo —
 * Lugares/Eventos/Galerías/Directorio son más de directorio que de feed). Mismo
 * patrón que ads.txt/route.ts y robots.ts/sitemap.ts: ruta generada desde
 * datos reales, no un archivo estático en `public/`. `/api/v1/articles` ya
 * ordena por publishedAt DESC (ArticlePublicController), así que alcanza
 * con pedir la primera página.
 */
export async function GET() {
  const [settings, page] = await Promise.all([
    getPlatformSettings(),
    listPublishedArticles({ page: 0, size: FEED_SIZE }),
  ]);

  const siteName = settings.shortName || settings.name;
  const description = settings.seoDefaultDescription || settings.description || siteName;

  const items = page.items
    .map((article) => {
      const link = `${SITE_URL}/publicaciones/${article.slug}`;
      const image = article.coverImageId
        ? imageUrl(`/api/v1/images/${article.coverImageId}/file`)
        : article.coverImageUrl;
      return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      ${article.publishedAt ? `<pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>` : ""}
      ${article.excerpt ? `<description>${escapeXml(article.excerpt)}</description>` : ""}
      ${image ? `<enclosure url="${escapeXml(image)}" type="image/jpeg" />` : ""}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <atom:link href="${escapeXml(SITE_URL)}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(description)}</description>
    <language>es</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import {
  getCategoryById,
  getGeographyUnitById,
  getPlatformSettings,
  getPublishedArticleBySlug,
  listAllTags,
  listPublishedArticles,
  listPublishedPlaces,
} from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { articleTypeLabel, formatArticleDate, formatPublishedDate } from "@/lib/content-labels";
import { YouTubeEmbed } from "@/components/article/youtube-embed";
import { ArticleCard } from "@/components/article/article-card";
import { PlaceCard } from "@/components/place/place-card";
import { AdBlock } from "@/components/legal/ad-block";
import { imageUrl } from "@/lib/image-url";
import { SITE_URL } from "@/lib/site-url";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import type { Article, Category } from "@/lib/api/types";

const RELATED_SIZE = 4;

async function loadArticle(slug: string) {
  try {
    return await getPublishedArticleBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata(props: PageProps<"/articulos/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  let article;
  try {
    article = await getPublishedArticleBySlug(slug);
  } catch {
    return {};
  }
  const settings = await getPlatformSettings();

  const title = article.seoTitle || article.title;
  const description = article.metaDescription || article.excerpt || undefined;

  return {
    title,
    description,
    // Por defecto, cada artículo es canónico de sí mismo (sección 15); solo
    // se sobreescribe si el editor definió explícitamente otra URL canónica
    // (ej. republicación de contenido originado en otro sitio).
    alternates: { canonical: article.canonicalUrl || `/articulos/${slug}` },
    robots: article.robots,
    openGraph: {
      title,
      description,
      type: "article",
      images: article.ogImageUrl ? [article.ogImageUrl] : undefined,
      publishedTime: article.publishedAt ?? undefined,
      siteName: settings.name,
    },
  };
}

function articleJsonLd(article: Article, category: Category | null, siteName: string) {
  const url = article.canonicalUrl || `${SITE_URL}/articulos/${article.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.seoTitle || article.title,
    description: article.metaDescription || article.excerpt || undefined,
    image: article.ogImageUrl ? [article.ogImageUrl] : undefined,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.publishedAt ?? undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: category?.name,
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
  };
}

function breadcrumbJsonLd(article: Article, category: Category | null) {
  const items = [
    { name: "Inicio", url: SITE_URL },
    ...(category ? [{ name: category.name, url: `${SITE_URL}/categorias/${category.slug}` }] : []),
    { name: article.title, url: `${SITE_URL}/articulos/${article.slug}` },
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export default async function ArticlePage(props: PageProps<"/articulos/[slug]">) {
  const { slug } = await props.params;
  const article = await loadArticle(slug);

  const [category, geography, tags, settings] = await Promise.all([
    getCategoryById(article.categoryId).catch(() => null),
    article.geographyId ? getGeographyUnitById(article.geographyId).catch(() => null) : Promise.resolve(null),
    article.tagIds.length > 0 ? listAllTags().catch(() => []) : Promise.resolve([]),
    getPlatformSettings(),
  ]);

  const articleTags = tags.filter((tag) => article.tagIds.includes(tag.id));

  const [relatedArticlesResult, relatedPlacesResult] = category
    ? await Promise.all([
        listPublishedArticles({ categoryId: category.id, size: RELATED_SIZE + 1 }),
        listPublishedPlaces({ categoryId: category.id, size: RELATED_SIZE }),
      ])
    : [null, null];
  const relatedArticles = (relatedArticlesResult?.items ?? [])
    .filter((a) => a.id !== article.id)
    .slice(0, RELATED_SIZE);
  const relatedPlaces = relatedPlacesResult?.items ?? [];

  const hasSidebar = relatedPlaces.length > 0 || relatedArticles.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd(article, category, settings.name)).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(article, category)).replace(/</g, "\\u003c"),
        }}
      />

      <div className={hasSidebar ? "lg:grid lg:grid-cols-12 lg:gap-12" : undefined}>
        <article className={`mx-auto max-w-3xl ${hasSidebar ? "lg:col-span-8 lg:mx-0 lg:max-w-none" : ""}`}>
          <nav aria-label="Breadcrumb" className="mb-4 flex max-w-[280px] items-center gap-2 truncate text-xs text-muted sm:max-w-none">
            <ol className="flex flex-wrap items-center gap-1.5 truncate">
              <li>
                <Link href="/" className="hover:text-accent hover:underline">
                  Inicio
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              {category && (
                <>
                  <li>
                    <Link href={`/categorias/${category.slug}`} className="hover:text-accent hover:underline">
                      {category.name}
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                </>
              )}
              <li className="max-w-[12rem] truncate text-foreground/80 sm:max-w-[24rem]" aria-current="page">
                {article.title}
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-accent uppercase">
            <span>{articleTypeLabel(article.articleType)}</span>
            {category && (
              <>
                <span aria-hidden="true" className="text-border">
                  ·
                </span>
                <span>{category.name}</span>
              </>
            )}
          </div>

          <h1 className="mt-4 text-2xl leading-tight font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border pb-6 text-xs text-muted sm:text-sm">
            {article.publishedAt && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                <time dateTime={article.publishedAt} title={formatPublishedDate(article.publishedAt)}>
                  {formatArticleDate(article.publishedAt)}
                </time>
              </span>
            )}
            {geography && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {geography.name}
              </span>
            )}
          </div>

          {article.featuredImageId && (
            <div className="relative my-8 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-zinc-950 shadow-lg">
              <SkeletonImage
                src={imageUrl(`/api/v1/images/${article.featuredImageId}/file`)}
                alt={article.title}
                className="object-cover"
              />
            </div>
          )}

          {article.youtubeVideoId && (
            // YouTubeEmbed ya trae su propio aspect-video (button/iframe) — este
            // wrapper solo agrega el borde/sombra consistente con la imagen de
            // portada, no un segundo aspect-ratio anidado.
            <div className="my-8 overflow-hidden rounded-2xl border border-border shadow-lg">
              <YouTubeEmbed videoId={article.youtubeVideoId} title={article.title} />
            </div>
          )}

          {article.excerpt && (
            <p className="mt-8 text-lg leading-relaxed font-medium text-foreground/90">
              {article.excerpt}
            </p>
          )}

          <div className="prose prose-slate sm:prose-lg mt-6 max-w-none whitespace-pre-line prose-headings:font-bold prose-a:text-accent">
            {article.body}
          </div>

          <div className="mt-10">
            <AdBlock position="article" />
          </div>

          {articleTags.length > 0 && (
            <ul className="mt-10 flex flex-wrap gap-2" aria-label="Etiquetas">
              {articleTags.map((tag) => (
                <li
                  key={tag.id}
                  className="rounded-full bg-border/50 px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-accent-soft hover:text-accent"
                >
                  {tag.name}
                </li>
              ))}
            </ul>
          )}
        </article>

        {hasSidebar && (
          <aside className="mt-14 lg:col-span-4 lg:mt-0">
            <div className="space-y-10 lg:sticky lg:top-24">
              {relatedPlaces.length > 0 && (
                <section aria-label="Lugares relacionados">
                  <h2 className="text-lg font-semibold text-foreground">
                    Lugares en {category!.name}
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    {relatedPlaces.map((place) => (
                      <PlaceCard key={place.id} place={place} />
                    ))}
                  </div>
                </section>
              )}

              {relatedArticles.length > 0 && (
                <section aria-label="Más artículos">
                  <h2 className="text-lg font-semibold text-foreground">
                    Más de {category!.name}
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    {relatedArticles.map((related) => (
                      <ArticleCard key={related.id} article={related} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

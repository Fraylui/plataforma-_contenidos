import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCategoryById,
  getGeographyUnitById,
  getPublishedArticleBySlug,
  listAllTags,
} from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { articleTypeLabel, formatPublishedDate } from "@/lib/content-labels";
import { YouTubeEmbed } from "@/components/article/youtube-embed";
import { platformPlaceholder } from "@/lib/platform-placeholder";

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

  const title = article.seoTitle || article.title;
  const description = article.metaDescription || article.excerpt || undefined;

  return {
    title,
    description,
    alternates: article.canonicalUrl ? { canonical: article.canonicalUrl } : undefined,
    robots: article.robots,
    openGraph: {
      title,
      description,
      type: "article",
      images: article.ogImageUrl ? [article.ogImageUrl] : undefined,
      publishedTime: article.publishedAt ?? undefined,
      siteName: platformPlaceholder.name,
    },
  };
}

export default async function ArticlePage(props: PageProps<"/articulos/[slug]">) {
  const { slug } = await props.params;
  const article = await loadArticle(slug);

  const [category, geography, tags] = await Promise.all([
    getCategoryById(article.categoryId).catch(() => null),
    article.geographyId ? getGeographyUnitById(article.geographyId).catch(() => null) : Promise.resolve(null),
    article.tagIds.length > 0 ? listAllTags().catch(() => []) : Promise.resolve([]),
  ]);

  const articleTags = tags.filter((tag) => article.tagIds.includes(tag.id));

  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
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

      <h1 className="mt-3 font-serif text-3xl font-medium leading-tight text-foreground sm:text-4xl">
        {article.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        {article.publishedAt && (
          <time dateTime={article.publishedAt}>{formatPublishedDate(article.publishedAt)}</time>
        )}
        {geography && (
          <span className="inline-flex items-center gap-1">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M9.69 18.933c.185.11.404.11.59 0 .014-.008 3.652-2.153 5.652-5.155C16.652 12.05 17 10.55 17 9c0-3.866-3.134-7-7-7S3 5.134 3 9c0 1.55.348 3.05 1.068 4.778 2 3.002 5.638 5.147 5.652 5.155ZM10 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                clipRule="evenodd"
              />
            </svg>
            {geography.name}
          </span>
        )}
      </div>

      {article.youtubeVideoId && (
        <div className="mt-8">
          <YouTubeEmbed videoId={article.youtubeVideoId} title={article.title} />
        </div>
      )}

      {article.excerpt && (
        <p className="mt-8 font-serif text-lg leading-relaxed text-foreground/90 italic">
          {article.excerpt}
        </p>
      )}

      <div className="mt-6 max-w-[70ch] text-base leading-relaxed whitespace-pre-line text-foreground">
        {article.body}
      </div>

      {articleTags.length > 0 && (
        <ul className="mt-10 flex flex-wrap gap-2" aria-label="Etiquetas">
          {articleTags.map((tag) => (
            <li
              key={tag.id}
              className="rounded-full border border-border bg-accent-soft px-3 py-1 text-xs font-medium text-accent"
            >
              {tag.name}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

import type { ArticleSummary } from "@/lib/api/types";
import { articleTypeLabel, formatArticleDate, formatPublishedDate } from "@/lib/content-labels";
import { imageUrl } from "@/lib/image-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Video } from "lucide-react";

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <AnimatedCard
      href={`/articulos/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-all duration-200 hover:border-accent hover:shadow-md focus-visible:border-accent"
    >
      <div className="relative aspect-video">
        {article.featuredImageId ? (
          // eslint-disable-next-line @next/next/no-img-element -- host propio del backend
          <img
            src={imageUrl(`/api/v1/images/${article.featuredImageId}/file`)}
            alt={article.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <NoImagePlaceholder />
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 40%, transparent 100%)" }}
        />
        <span className="absolute inset-x-0 bottom-0 h-1 bg-accent" aria-hidden="true" />
        <span className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
          {articleTypeLabel(article.articleType)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {article.hasVideo && (
          <span className="inline-flex w-fit items-center gap-1 text-xs font-medium tracking-wide text-muted uppercase">
            <Video className="h-3.5 w-3.5" aria-hidden="true" />
            Video
          </span>
        )}

        <h2 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
          {article.title}
        </h2>

        {article.excerpt && (
          <p className="text-sm leading-relaxed text-muted line-clamp-3">
            {article.excerpt}
          </p>
        )}

        {article.publishedAt && (
          <time
            dateTime={article.publishedAt}
            title={formatPublishedDate(article.publishedAt)}
            className="mt-auto text-xs text-muted"
          >
            {formatArticleDate(article.publishedAt)}
          </time>
        )}
      </div>
    </AnimatedCard>
  );
}

import type { ArticleSummary } from "@/lib/api/types";
import { articleTypeLabel, formatArticleDate, formatPublishedDate } from "@/lib/content-labels";
import { AnimatedCard } from "@/components/ui/animated-card";
import { CardMedia } from "@/components/ui/card-media";
import { Video } from "lucide-react";

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <AnimatedCard href={`/publicaciones/${article.slug}`}>
      <CardMedia
        imageId={article.featuredImageId}
        alt={article.title}
        badge={articleTypeLabel(article.articleType)}
      />

      <div className="flex flex-1 flex-col gap-2 p-4">
        {article.hasVideo && (
          <span className="inline-flex w-fit items-center gap-1 text-xs font-medium tracking-wide text-muted uppercase">
            <Video className="h-3.5 w-3.5" aria-hidden="true" />
            Video
          </span>
        )}

        <h2 className="line-clamp-2 min-h-[2.5rem] text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
          {article.title}
        </h2>

        {article.excerpt && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">
            {article.excerpt}
          </p>
        )}

        {article.publishedAt && (
          <time
            dateTime={article.publishedAt}
            title={formatPublishedDate(article.publishedAt)}
            className="mt-auto border-t border-border/60 pt-2 text-xs text-muted"
          >
            {formatArticleDate(article.publishedAt)}
          </time>
        )}
      </div>
    </AnimatedCard>
  );
}

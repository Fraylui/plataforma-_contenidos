import Link from "next/link";
import type { ArticleSummary } from "@/lib/api/types";
import { articleTypeLabel, formatPublishedDate } from "@/lib/content-labels";

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <Link
      href={`/articulos/${article.slug}`}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent focus-visible:border-accent"
    >
      <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-accent uppercase">
        <span>{articleTypeLabel(article.articleType)}</span>
        {article.hasVideo && (
          <span
            aria-label="Incluye video"
            className="inline-flex items-center gap-1 text-muted normal-case"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M2 5.5A2.5 2.5 0 0 1 4.5 3h6A2.5 2.5 0 0 1 13 5.5v9a2.5 2.5 0 0 1-2.5 2.5h-6A2.5 2.5 0 0 1 2 14.5v-9ZM14.5 8.086l3.223-1.611A1 1 0 0 1 19 7.362v5.276a1 1 0 0 1-1.277.961L14.5 11.914V8.086Z" />
            </svg>
            Video
          </span>
        )}
      </div>

      <h2 className="font-serif text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
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
          className="mt-auto text-xs text-muted"
        >
          {formatPublishedDate(article.publishedAt)}
        </time>
      )}
    </Link>
  );
}

import type { ArticleSummary } from "@/lib/api/types";
import { formatArticleDate, formatPublishedDate } from "@/lib/content-labels";
import { AnimatedCard } from "@/components/ui/animated-card";
import { CardMedia } from "@/components/ui/card-media";
import { CardKicker } from "@/components/ui/card-kicker";
import { cn } from "@/lib/utils";
import { Video } from "lucide-react";

/**
 * `featured`: primer ítem del listado, más grande y horizontal (imagen a la
 * izquierda en pantallas grandes) — rompe la monotonía de una grilla plana
 * de tarjetas idénticas (mismo criterio ya aplicado en el Home).
 */
export function ArticleCard({
  article,
  categoryName,
  featured = false,
}: {
  article: ArticleSummary;
  categoryName?: string;
  featured?: boolean;
}) {
  return (
    <AnimatedCard
      href={`/publicaciones/${article.slug}`}
      className={featured ? "sm:col-span-2 lg:grid lg:grid-cols-[1.1fr_1fr] lg:col-span-2" : undefined}
    >
      <CardMedia
        imageId={article.coverImageId}
        externalUrl={article.coverImageUrl}
        alt={article.title}
        className={featured ? "lg:aspect-auto lg:min-h-full" : undefined}
      />

      <div className={cn("flex flex-1 flex-col gap-2 p-4", featured && "sm:p-6")}>
        <CardKicker categoryName={categoryName} />
        {article.hasVideo && (
          <span className="inline-flex w-fit items-center gap-1 text-xs font-medium tracking-wide text-muted uppercase">
            <Video className="h-3.5 w-3.5" aria-hidden="true" />
            Video
          </span>
        )}

        <h2
          className={cn(
            "line-clamp-2 min-h-[2.5rem] font-semibold leading-snug text-foreground transition-colors group-hover:text-accent",
            featured ? "text-xl sm:text-2xl" : "text-lg",
          )}
        >
          {article.title}
        </h2>

        {article.excerpt && (
          <p className={cn("text-sm leading-relaxed text-muted", featured ? "line-clamp-3" : "line-clamp-2")}>
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

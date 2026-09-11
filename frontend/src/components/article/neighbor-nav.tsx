import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ArticleNeighbors, ArticleSummary } from "@/lib/api/types";
import { articleTypeLabel } from "@/lib/content-labels";
import { serverImageUrl } from "@/lib/server-image-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { cn } from "@/lib/utils";

/**
 * Anterior / Siguiente al pie de una publicación, como tarjetas con
 * miniatura en vez de dos botones con flecha: el lector decide por la
 * portada y el título, no por la palabra "Siguiente" (patrón de "seguir
 * leyendo" de los sitios de contenido actuales). En celular se apilan.
 */
export function NeighborNav({ neighbors }: { neighbors: ArticleNeighbors }) {
  if (!neighbors.previous && !neighbors.next) return null;
  return (
    <nav aria-label="Seguir leyendo" className="mt-10">
      <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">Seguir leyendo</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {neighbors.previous ? <NeighborCard article={neighbors.previous} direction="previous" /> : <span className="hidden sm:block" />}
        {neighbors.next && <NeighborCard article={neighbors.next} direction="next" />}
      </div>
    </nav>
  );
}

function NeighborCard({ article, direction }: { article: ArticleSummary; direction: "previous" | "next" }) {
  const isNext = direction === "next";
  return (
    <Link
      href={`/publicaciones/${article.slug}`}
      className={cn(
        "group flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-3 transition-[border-color,box-shadow] hover:border-accent/60 hover:shadow-md",
        isNext && "sm:flex-row-reverse sm:text-right",
      )}
    >
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-canvas-strong sm:h-[4.5rem] sm:w-24">
        {article.featuredImageId ? (
          <SkeletonImage src={serverImageUrl(`/api/v1/images/${article.featuredImageId}/file`)} alt="" className="object-cover" sizes="96px" />
        ) : (
          <NoImagePlaceholder />
        )}
      </div>
      <div className={cn("flex min-w-0 flex-col gap-1", isNext && "sm:items-end")}>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider text-accent uppercase">
          {!isNext && <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />}
          {isNext ? "Siguiente" : "Anterior"}
          {isNext && <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
          <span className="font-medium text-muted normal-case tracking-normal">· {articleTypeLabel(article.articleType)}</span>
        </span>
        <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-accent sm:text-[15px]">
          {article.title}
        </span>
      </div>
    </Link>
  );
}

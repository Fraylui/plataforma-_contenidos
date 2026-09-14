import { AnimatedCard } from "@/components/ui/animated-card";
import { CardMedia } from "@/components/ui/card-media";
import { Highlighted } from "@/components/ui/highlighted";
import { searchResultHref, searchResultTypeLabel } from "@/lib/content-labels";
import type { SearchResult } from "@/lib/api/types";

/**
 * Resultado de /buscar: puede ser cualquiera de los 6 tipos buscables
 * (CONTEXTO.md sección 16). Mismo tratamiento visual que ArticleCard/
 * PlaceCard, con la URL armada según `contentType` (ver content-labels.ts).
 * `query` resalta el término buscado en título/extracto (mismo criterio
 * visual que las sugerencias en vivo del header).
 */
export function SearchResultCard({ result, query }: { result: SearchResult; query: string }) {
  return (
    <AnimatedCard href={searchResultHref(result.contentType, result.slug)}>
      <CardMedia
        imageId={result.featuredImageId}
        externalUrl={result.featuredImageUrl}
        alt={result.title}
        badge={searchResultTypeLabel(result.contentType)}
      />

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
          <Highlighted text={result.title} query={query} />
        </h2>
        {result.excerpt && (
          <p className="text-sm leading-relaxed text-muted line-clamp-3">
            <Highlighted text={result.excerpt} query={query} />
          </p>
        )}
      </div>
    </AnimatedCard>
  );
}

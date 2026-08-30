import { AnimatedCard } from "@/components/ui/animated-card";
import { CardMedia } from "@/components/ui/card-media";
import type { SearchResult } from "@/lib/api/types";

const TYPE_LABEL: Record<SearchResult["contentType"], string> = {
  ARTICLE: "Publicación",
  PLACE: "Lugar",
  EVENT: "Evento",
  GALLERY: "Galería",
  REVIEW: "Reseña",
  BUSINESS: "Directorio",
};

/**
 * Resultado de /buscar: puede ser un Artículo o un Lugar (CONTEXTO.md
 * sección 16 — la búsqueda ya no es solo de artículos). Mismo tratamiento
 * visual que ArticleCard/PlaceCard, con la URL armada según `contentType`.
 */
const CONTENT_TYPE_PATH: Record<SearchResult["contentType"], string> = {
  ARTICLE: "articulos",
  PLACE: "lugares",
  EVENT: "eventos",
  GALLERY: "galerias",
  REVIEW: "resenas",
  BUSINESS: "directorio",
};

export function SearchResultCard({ result }: { result: SearchResult }) {
  const href = `/${CONTENT_TYPE_PATH[result.contentType]}/${result.slug}`;

  return (
    <AnimatedCard href={href}>
      <CardMedia imageId={result.featuredImageId} alt={result.title} badge={TYPE_LABEL[result.contentType]} />

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
          {result.title}
        </h2>
        {result.excerpt && <p className="text-sm leading-relaxed text-muted line-clamp-3">{result.excerpt}</p>}
      </div>
    </AnimatedCard>
  );
}

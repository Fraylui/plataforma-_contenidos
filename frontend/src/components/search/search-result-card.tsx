import Link from "next/link";
import type { SearchResult } from "@/lib/api/types";
import { imageUrl } from "@/lib/image-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";

const TYPE_LABEL: Record<SearchResult["contentType"], string> = {
  ARTICLE: "Artículo",
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
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-md focus-visible:border-accent"
    >
      <div className="aspect-video">
        {result.featuredImageId ? (
          // eslint-disable-next-line @next/next/no-img-element -- host propio del backend
          <img
            src={imageUrl(`/api/v1/images/${result.featuredImageId}/file`)}
            alt={result.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <NoImagePlaceholder />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-xs font-medium tracking-wide text-accent uppercase">
          {TYPE_LABEL[result.contentType]}
        </span>
        <h2 className="font-serif text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
          {result.title}
        </h2>
        {result.excerpt && <p className="text-sm leading-relaxed text-muted line-clamp-3">{result.excerpt}</p>}
      </div>
    </Link>
  );
}

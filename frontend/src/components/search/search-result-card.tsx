import Link from "next/link";
import type { SearchResult } from "@/lib/api/types";
import { imageUrl } from "@/lib/image-url";

const TYPE_LABEL: Record<SearchResult["contentType"], string> = {
  ARTICLE: "Artículo",
  PLACE: "Lugar",
};

/**
 * Resultado de /buscar: puede ser un Artículo o un Lugar (CONTEXTO.md
 * sección 16 — la búsqueda ya no es solo de artículos). Mismo tratamiento
 * visual que ArticleCard/PlaceCard, con la URL armada según `contentType`.
 */
export function SearchResultCard({ result }: { result: SearchResult }) {
  const href = result.contentType === "ARTICLE" ? `/articulos/${result.slug}` : `/lugares/${result.slug}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-accent focus-visible:border-accent"
    >
      <div className="aspect-video bg-border">
        {result.featuredImageId ? (
          // eslint-disable-next-line @next/next/no-img-element -- host propio del backend
          <img
            src={imageUrl(`/api/v1/images/${result.featuredImageId}/file`)}
            alt={result.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted">Sin fotografía</div>
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

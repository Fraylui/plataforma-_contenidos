"use client";

import type { HomeItem } from "@/lib/home-items";
import { GridTile } from "@/components/post/grid-tile";
import { useFeedPages, type FeedFilter } from "./use-feed-pages";

const PAGE_SIZE = 18; // múltiplo de 3: cada tanda completa filas

/**
 * Cuadrícula de Explorar (como la de Instagram): miniaturas cuadradas de 3
 * en fondo, pegadas con 2 px de separación, con scroll infinito sobre el
 * mismo /api/feed del inicio. Ícono de carrusel, video o evento en cada
 * miniatura (GridTile).
 */
export function ExploreGrid({
  initialItems,
  initialHasMore,
  seed,
  filter = {},
}: {
  initialItems: HomeItem[];
  initialHasMore: boolean;
  seed: string;
  filter?: FeedFilter;
}) {
  const { items, hasMore, loading, error, loadMore, sentinelRef } = useFeedPages({
    initialItems,
    initialHasMore,
    seed,
    filter,
    pageSize: PAGE_SIZE,
  });

  if (items.length === 0 && !hasMore) {
    return <p className="px-4 py-16 text-center text-sm text-muted">Todavía no hay nada para explorar.</p>;
  }

  return (
    <>
      <ul aria-label="Explorar" className="grid grid-cols-3 gap-0.5 sm:gap-1">
        {items.map((item) => (
          <li key={item.id}>
            <GridTile item={item} />
          </li>
        ))}
      </ul>

      {error && (
        <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted">
          No se pudo cargar más.
          <button
            type="button"
            onClick={() => void loadMore()}
            className="min-h-11 cursor-pointer rounded-full bg-surface px-5 font-semibold text-foreground shadow-sm hover:bg-canvas-strong"
          >
            Reintentar
          </button>
        </div>
      )}

      {hasMore && !error && (
        <div ref={sentinelRef} aria-hidden={!loading} className="mt-0.5 grid grid-cols-3 gap-0.5 sm:mt-1 sm:gap-1">
          {loading && (
            <>
              <span className="sr-only" role="status">
                Cargando más…
              </span>
              {[0, 1, 2].map((i) => (
                <div key={i} className="aspect-square animate-pulse bg-canvas-strong" aria-hidden="true" />
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
}

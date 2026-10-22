"use client";

import type { HomeItem } from "@/lib/home-items";
import { GridTile } from "@/components/post/grid-tile";
import { useFeedPages, type FeedFilter } from "./use-feed-pages";

const PAGE_SIZE = 18; // múltiplo de 6: cada tanda completa sus bloques
/** Una miniatura grande por cada tantas (cada bloque de 6 llena 3 filas exactas). */
const LARGE_EVERY = 6;

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
      {/* Ritmo del Explorar de Instagram: en cada bloque de 6 una grande (2×2), a la izquierda y luego a
          la derecha; grid-flow-dense hace que las chicas llenen los huecos. */}
      <ul aria-label="Explorar" className="grid grid-flow-dense grid-cols-3 gap-0.5 sm:gap-1">
        {items.map((item, index) => {
          const large = index % LARGE_EVERY === 0;
          const right = index % (LARGE_EVERY * 2) === LARGE_EVERY;
          return (
            <li
              key={item.id}
              data-size={large ? "large" : undefined}
              className={large ? `col-span-2 row-span-2${right ? " col-start-2" : ""}` : undefined}
            >
              <GridTile item={item} large={large} priority={index === 0} />
            </li>
          );
        })}
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

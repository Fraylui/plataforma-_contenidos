"use client";

import { Fragment } from "react";
import type { HomeItem } from "@/lib/home-items";
import { AdBlockClient } from "@/components/legal/ad-block-client";
import { TopLikedList } from "@/components/content/top-liked-list";
import { PostCard } from "@/components/post/post-card";
import type { PostBrand } from "@/components/post/post-header";
import { useFeedPages, type FeedFilter } from "./use-feed-pages";

const PAGE_SIZE = 12;
/** Un anuncio cada 6 posts y nunca antes del 6º (~14 %, tope Better Ads 30 %). */
const AD_EVERY = 6;
/** Después de qué post va "Lo más gustado" en celular (en escritorio vive en la columna derecha). */
const TOP_LIKED_AFTER = 3;


/**
 * Feed de una columna estilo Instagram con scroll infinito. Arranca con el
 * lote que trajo el servidor (render inicial y SEO sin JavaScript) y pide
 * más a /api/feed al acercarse al final, excluyendo lo ya visto. `filter`
 * es el mismo en todas las páginas que lo usan: inicio (vacío), secciones
 * (`type`), temas (`categoryId`) y Agenda (`type: "EVENT", sort: "upcoming"`).
 */
export function Feed({
  initialItems,
  initialHasMore,
  seed,
  filter,
  brand,
  categoryNames,
  feedAd,
  topLiked = [],
  adSection = "HOME",
  emptyMessage = "Todavía no hay publicaciones.",
}: {
  initialItems: HomeItem[];
  initialHasMore: boolean;
  seed: string;
  filter: FeedFilter;
  brand: PostBrand;
  categoryNames: Record<string, string>;
  feedAd: { clientId: string; slot: string } | null;
  topLiked?: HomeItem[];
  adSection?: "HOME" | "ARTICLE" | "PLACE" | "EVENT" | "GALLERY" | "BUSINESS";
  emptyMessage?: string;
}) {
  const { items, hasMore, loading, error, loadMore, sentinelRef } = useFeedPages({
    initialItems,
    initialHasMore,
    seed,
    filter,
    pageSize: PAGE_SIZE,
  });

  if (items.length === 0 && !hasMore) {
    return <p className="px-4 py-16 text-center text-sm text-muted">{emptyMessage}</p>;
  }

  let adSlot = 0;
  return (
    <div className="flex flex-col gap-0 sm:gap-6">
      {items.map((item, index) => {
        const position = index + 1;
        const withAd = position % AD_EVERY === 0;
        const slot = withAd ? adSlot++ : -1;
        return (
          <Fragment key={item.id}>
            <PostCard item={item} brand={brand} categoryName={categoryNames[item.categoryId]} priority={index === 0} />
            {position === TOP_LIKED_AFTER && topLiked.length >= 3 && (
              <TopLikedList
                items={topLiked}
                className="border-b border-border/70 bg-surface p-4 sm:rounded-2xl sm:border xl:hidden"
              />
            )}
            {withAd && (
              <AdBlockClient position="en-feed" slot={slot} layout="fill" context={{ section: adSection }} adsense={feedAd} className="px-4 py-3 sm:px-0" />
            )}
          </Fragment>
        );
      })}

      {error && (
        <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted">
          No se pudo cargar más.
          <button type="button" onClick={() => void loadMore()} className="min-h-11 cursor-pointer rounded-full border border-border px-5 font-semibold text-foreground hover:bg-canvas">
            Reintentar
          </button>
        </div>
      )}

      {hasMore && !error && (
        <div ref={sentinelRef} aria-hidden={!loading} className="flex flex-col gap-6">
          {loading && (
            <>
              <span className="sr-only" role="status">
                Cargando más publicaciones…
              </span>
              {[0, 1].map((i) => (
                <div key={i} className="animate-pulse bg-surface sm:rounded-2xl" aria-hidden="true">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="h-9 w-9 rounded-full bg-canvas-strong" />
                    <div className="h-3 w-32 rounded bg-canvas-strong" />
                  </div>
                  <div className="aspect-square bg-canvas-strong" />
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

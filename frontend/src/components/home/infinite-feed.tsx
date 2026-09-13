"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeItem } from "@/lib/home-items";
import { ContentCard, FeaturedContentCard } from "@/components/home/content-card";

const PAGE_SIZE = 12;

/**
 * Scroll infinito del home (recomendación de home/algoritmo de
 * descubrimiento): arranca con el lote que ya trajo el servidor (SSR, para
 * que el primer render y el SEO de la portada no dependan de JS) y sigue
 * pidiendo más a /api/feed a medida que el visitante se acerca al final.
 * `seed` viene del servidor y se reenvía en cada pedido: el backend arma un
 * orden distinto por sesión pero reproducible mientras dure el scroll (ver
 * FeedService.diversify en el backend).
 */
export function InfiniteFeed({
  initialItems,
  initialHasMore,
  seed,
  categoryNames,
}: {
  initialItems: HomeItem[];
  initialHasMore: boolean;
  seed: string;
  categoryNames: Record<string, string>;
}) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set(initialItems.map((item) => item.id)));
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    setError(false);
    try {
      const query = new URLSearchParams({ size: String(PAGE_SIZE), seed });
      for (const id of seenIdsRef.current) query.append("exclude", id);

      const res = await fetch(`/api/feed?${query.toString()}`);
      if (!res.ok) throw new Error("No se pudo cargar más contenido");
      const page: { items: HomeItem[]; hasMore: boolean } = await res.json();

      for (const item of page.items) seenIdsRef.current.add(item.id);
      setItems((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
    } catch {
      setError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasMore, seed]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    // rootMargin grande: la siguiente tanda ya está en camino antes de que
    // el visitante llegue al fondo real, para que el scroll se sienta continuo.
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: "600px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (items.length === 0) return null;
  const [first, ...rest] = items;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <FeaturedContentCard item={first} categoryName={categoryNames[first.categoryId]} cta="Ver" />
        {rest.map((item) => (
          <ContentCard key={item.id} item={item} categoryName={categoryNames[item.categoryId]} />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:grid-cols-3" aria-hidden={!loading}>
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[16/10] animate-pulse rounded-2xl bg-zinc-100" aria-hidden="true" />
            ))}
        </div>
      )}

      {error && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="cursor-pointer rounded-full border border-accent bg-surface px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reintentar
          </button>
        </div>
      )}

      {!hasMore && !error && (
        <p className="mt-6 text-center text-sm text-muted">Llegaste al final por ahora — vuelve pronto por más.</p>
      )}
    </>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeItem } from "@/lib/home-items";
import type { FeedItemType } from "@/lib/api/types";

export interface FeedFilter {
  type?: FeedItemType;
  categoryId?: string;
  sort?: "upcoming";
}

/**
 * Scroll infinito compartido por el feed de una columna y la cuadrícula de
 * Explorar: arranca con el lote del servidor (SEO sin JavaScript), pide más
 * a /api/feed cuando el centinela se acerca a la pantalla y excluye lo ya
 * visto para no repetir.
 */
export function useFeedPages({
  initialItems,
  initialHasMore,
  seed,
  filter,
  pageSize,
}: {
  initialItems: HomeItem[];
  initialHasMore: boolean;
  seed: string;
  filter: FeedFilter;
  pageSize: number;
}) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const seenRef = useRef<Set<string>>(new Set(initialItems.map((i) => i.id)));
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    setError(false);
    try {
      const query = new URLSearchParams({ size: String(pageSize), seed });
      if (filter.type) query.set("type", filter.type);
      if (filter.categoryId) query.set("categoryId", filter.categoryId);
      if (filter.sort) query.set("sort", filter.sort);
      for (const id of seenRef.current) query.append("exclude", id);
      const res = await fetch(`/api/feed?${query.toString()}`);
      if (!res.ok) throw new Error("feed");
      const page = (await res.json()) as { items: HomeItem[]; hasMore: boolean };
      const fresh = page.items.filter((i) => !seenRef.current.has(i.id));
      fresh.forEach((i) => seenRef.current.add(i.id));
      setItems((prev) => [...prev, ...fresh]);
      setHasMore(page.hasMore && fresh.length > 0);
    } catch {
      setError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [filter.categoryId, filter.sort, filter.type, hasMore, pageSize, seed]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || error) return;
    // Margen amplio: la siguiente tanda llega antes de que se vea el final.
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadMore();
    }, { rootMargin: "800px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, hasMore, loadMore]);

  return { items, hasMore, loading, error, loadMore, sentinelRef };
}

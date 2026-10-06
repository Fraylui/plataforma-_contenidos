"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type { HomeItem } from "@/lib/home-items";
import { ContentCard, FeaturedContentCard } from "@/components/home/content-card";
import { AdBlockClient } from "@/components/legal/ad-block-client";
import { TopLikedList } from "@/components/content/top-liked-list";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;
/**
 * Anuncios cada AD_EVERY_CELLS celdas de grilla (par, por el celular). El
 * anuncio (rectángulo medio 300×250) ocupa el lugar de UNA tarjeta en escritorio y la fila entera en celular (dos
 * columnas de 170 px lo dejarían ilegible), así que se cuenta como 2 celdas:
 * en celular siempre cae tras una fila llena y no deja huecos. La destacada
 * y "Lo más gustado" ocupan 2 celdas cada una. El primero recién a partir de
 * FIRST_AD_CELL: la primera pantalla es contenido, no publicidad. Densidad:
 * 1 anuncio cada 6 tarjetas (≈1 por pantalla, ~14 % de la grilla), muy por
 * debajo del 30 % de la Coalition for Better Ads.
 */
const AD_EVERY_CELLS = 8;
const FIRST_AD_CELL = 12;
/** Después de qué tarjeta va "Lo más gustado" (una sola vez, solo en "Todo"). */
const TOP_LIKED_AFTER = 4;

export type FeedTab = "" | "ARTICLE" | "PLACE" | "EVENT";

/**
 * Scroll infinito del home: arranca con el lote que ya trajo el servidor
 * (para que el primer render y el SEO no dependan de JS) y sigue pidiendo
 * más a /api/feed a medida que el visitante se acerca al final. `seed` viene
 * del servidor (una por hora, ver app/(public)/page.tsx) y hace reproducible
 * el orden de una página a la siguiente (FeedService.diversify).
 *
 * Tomado de los feeds de MSN y Substack, adaptado a un sitio sin cuentas:
 *  - Pestañas "Todo · Publicaciones · Lugares · Eventos" para segmentar
 *    sin salir del home.
 *  - Un espacio publicitario cada AD_EVERY tarjetas (posición "en-feed":
 *    campaña directa o AdSense; si no hay ninguna no ocupa lugar).
 *  - Una tarjeta de lista "Lo más gustado" mezclada en la grilla, con me
 *    gusta reales — nunca relleno.
 */
export function InfiniteFeed({
  initialItems,
  initialHasMore,
  seed,
  categoryNames,
  tabs,
  feedAd,
  topLiked,
}: {
  initialItems: HomeItem[];
  initialHasMore: boolean;
  seed: string;
  categoryNames: Record<string, string>;
  tabs: { value: FeedTab; label: string }[];
  feedAd: { clientId: string; slot: string } | null;
  topLiked: HomeItem[];
}) {
  const [tab, setTab] = useState<FeedTab>("");
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set(initialItems.map((item) => item.id)));
  const loadingRef = useRef(false);
  // Invalida respuestas de una pestaña anterior que lleguen tarde.
  const requestRef = useRef(0);

  const fetchPage = useCallback(
    async (forTab: FeedTab, exclude: Iterable<string>) => {
      const query = new URLSearchParams({ size: String(PAGE_SIZE), seed });
      if (forTab) query.set("type", forTab);
      for (const id of exclude) query.append("exclude", id);
      const res = await fetch(`/api/feed?${query.toString()}`);
      if (!res.ok) throw new Error("No se pudo cargar más contenido");
      return (await res.json()) as { items: HomeItem[]; hasMore: boolean };
    },
    [seed],
  );

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    const request = ++requestRef.current;
    setLoading(true);
    setError(false);
    try {
      const page = await fetchPage(tab, seenIdsRef.current);
      if (request !== requestRef.current) return;
      for (const item of page.items) seenIdsRef.current.add(item.id);
      setItems((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
    } catch {
      if (request === requestRef.current) setError(true);
    } finally {
      if (request === requestRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [fetchPage, hasMore, tab]);

  async function selectTab(next: FeedTab) {
    if (next === tab) return;
    const request = ++requestRef.current;
    setTab(next);
    setError(false);
    if (next === "") {
      // "Todo" vuelve al lote que ya trajo el servidor, sin pedir nada.
      seenIdsRef.current = new Set(initialItems.map((item) => item.id));
      setItems(initialItems);
      setHasMore(initialHasMore);
      loadingRef.current = false;
      setLoading(false);
      return;
    }
    loadingRef.current = true;
    setLoading(true);
    setItems([]);
    try {
      const page = await fetchPage(next, []);
      if (request !== requestRef.current) return;
      seenIdsRef.current = new Set(page.items.map((item) => item.id));
      setItems(page.items);
      setHasMore(page.hasMore);
    } catch {
      if (request === requestRef.current) setError(true);
    } finally {
      if (request === requestRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }

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

  const [first, ...rest] = items;
  const showTopLiked = tab === "" && topLiked.length >= 3;
  // Qué va después de cada tarjeta, contando celdas de grilla (ver AD_EVERY_CELLS).
  let cells = 2; // la destacada
  let ads = 0;
  const layout = rest.map((item, index) => {
    cells += 1;
    const withTopLiked = showTopLiked && index + 2 === TOP_LIKED_AFTER;
    if (withTopLiked) cells += 2;
    const withAd = cells >= FIRST_AD_CELL && cells % AD_EVERY_CELLS === 0;
    // Índice del espacio: cada uno recibe otra campaña de la rotación (nunca la misma dos veces).
    const adSlot = withAd ? ads++ : -1;
    if (withAd) cells += 2;
    return { item, withTopLiked, adSlot };
  });

  return (
    <>
      {tabs.length > 2 && (
        <div
          role="tablist"
          aria-label="Filtrar el feed"
          className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((option) => {
            const active = option.value === tab;
            return (
              <button
                key={option.value || "todo"}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(option.value)}
                className={cn(
                  "min-h-10 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors",
                  active
                    ? "border-accent bg-accent-fill text-accent-foreground"
                    : "border-foreground/[0.08] bg-surface text-foreground hover:border-accent/60 hover:text-accent",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      {first && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <FeaturedContentCard item={first} categoryName={categoryNames[first.categoryId]} cta="Ver" />
          {layout.map(({ item, withTopLiked, adSlot }) => (
            <Fragment key={item.id}>
              <ContentCard item={item} categoryName={categoryNames[item.categoryId]} />
              {withTopLiked && <TopLikedCard items={topLiked} />}
              {adSlot >= 0 && (
                <AdBlockClient
                  position="en-feed"
                  slot={adSlot}
                  layout="fill"
                  context={{ section: "HOME" }}
                  adsense={feedAd}
                  className="col-span-2 self-center sm:col-span-1"
                />
              )}
            </Fragment>
          ))}
        </div>
      )}

      {(hasMore || (loading && items.length === 0)) && (
        <div ref={sentinelRef} className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:grid-cols-3" aria-hidden={!loading}>
          {loading &&
            Array.from({ length: items.length === 0 ? 6 : 4 }).map((_, i) => (
              <div key={i} className="aspect-[16/10] animate-pulse rounded-2xl bg-canvas-strong" aria-hidden="true" />
            ))}
        </div>
      )}

      {error && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => (items.length === 0 ? selectTab(tab === "" ? "ARTICLE" : tab) : loadMore())}
            disabled={loading}
            className="min-h-11 cursor-pointer rounded-full border border-accent bg-surface px-5 text-sm font-semibold text-accent transition-colors hover:bg-accent-fill hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reintentar
          </button>
        </div>
      )}

      {!hasMore && !error && !loading && items.length > 0 && (
        <p className="mt-6 text-center text-sm text-muted">Llegaste al final por ahora — vuelve pronto por más.</p>
      )}
    </>
  );
}

/** "Lo más gustado" como una celda más de la grilla (2 columnas de ancho). */
function TopLikedCard({ items }: { items: HomeItem[] }) {
  return (
    <TopLikedList
      items={items}
      className="col-span-2 rounded-2xl border border-foreground/[0.06] bg-surface p-4 shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_8px_20px_-12px_rgb(0_0_0_/_0.08)]"
    />
  );
}

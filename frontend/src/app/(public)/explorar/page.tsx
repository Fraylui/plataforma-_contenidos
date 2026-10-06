import type { Metadata } from "next";
import { getFeed, getPrimaryNavVisibility } from "@/lib/api/client";
import { fromFeedItem } from "@/lib/home-items";
import type { FeedItemType } from "@/lib/api/types";
import { ExploreGrid } from "@/components/feed/explore-grid";
import { FilterChips } from "@/components/feed/filter-chips";
import { exploreChipOptions } from "@/components/feed/type-chips";

const INITIAL_SIZE = 24; // múltiplo de 3: filas completas en el HTML inicial
const TYPES = new Set<FeedItemType>(["ARTICLE", "PLACE", "EVENT", "GALLERY", "BUSINESS"]);

export const metadata: Metadata = {
  title: "Explorar",
  description: "Descubre lugares, eventos, galerías y publicaciones en una cuadrícula de fotos.",
  alternates: { canonical: "/explorar" },
};

/**
 * Explorar (pestaña de la barra inferior y del riel): cuadrícula de 3 como
 * la de Instagram, con chips de tipo arriba. El primer lote sale en el HTML
 * (bots y sin JavaScript); el resto llega con scroll infinito. Semilla por
 * hora, igual que el inicio, para poder cachear la página.
 */
export default async function ExplorePage({ searchParams }: PageProps<"/explorar">) {
  const { tipo } = await searchParams;
  const type = typeof tipo === "string" && TYPES.has(tipo as FeedItemType) ? (tipo as FeedItemType) : undefined;
  const seed = `explorar-${new Date().toISOString().slice(0, 13)}`;
  const [page, visibility] = await Promise.all([
    getFeed({ size: INITIAL_SIZE, seed, type }),
    getPrimaryNavVisibility(),
  ]);

  return (
    <div className="mx-auto w-full max-w-[935px] py-3 sm:px-4 sm:py-6">
      <h1 className="sr-only">Explorar</h1>
      <FilterChips label="Tipo de contenido" options={exploreChipOptions(visibility, type)} className="mb-3 px-4 sm:px-0" />
      <ExploreGrid
        key={type ?? "todo"}
        initialItems={page.items.map(fromFeedItem)}
        initialHasMore={page.hasMore}
        seed={seed}
        filter={type ? { type } : {}}
      />
    </div>
  );
}

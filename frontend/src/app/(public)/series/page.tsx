import type { Metadata } from "next";
import { Television } from "@phosphor-icons/react/dist/ssr";
import { getFeed, listPublishedSeries } from "@/lib/api/client";
import { fromFeedItem } from "@/lib/home-items";
import { KeepExploring } from "@/components/feed/keep-exploring";
import { Pagination } from "@/components/ui/pagination";
import { SeriesCardView } from "@/components/series/series-cards";
import { orNull } from "@/lib/server-log";

export const metadata: Metadata = {
  title: "Series",
  description: "Programas en video y podcast: curiosidades, historia, animales, tecnología, lugares y más.",
  alternates: { canonical: "/series" },
};

const PAGE_SIZE = 24;

/**
 * Series: los programas que se transmiten en YouTube, como el catálogo de una
 * plataforma de streaming. Cada portada lleva a la serie con sus episodios.
 */
export default async function SeriesListPage({ searchParams }: PageProps<"/series">) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(0, Number.parseInt(typeof pageParam === "string" ? pageParam : "0", 10) || 0);
  const result = await listPublishedSeries({ page, size: PAGE_SIZE });
  // Sin programas todavía: no es un callejón sin salida, se ofrece lo más reciente.
  const meanwhile = result.items.length === 0 ? (await getFeed({ size: 6 }).catch(orNull("series.recientes")))?.items.map(fromFeedItem) ?? [] : [];

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6">
      {/* La franja superior ya no repite el nombre de la pantalla (2026-10-21): el título va aquí, visible. */}
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Series</h1>
        <p className="mt-1 text-sm text-muted">Programas en video y podcast. Elige uno y mira sus episodios.</p>
      </header>

      {result.items.length === 0 ? (
        <>
          <p className="flex items-center gap-3 rounded-card bg-surface px-5 py-4 text-sm font-medium text-foreground shadow-card">
            <Television weight="fill" className="size-6 shrink-0 text-accent" aria-hidden="true" />
            Muy pronto, nuestros primeros programas.
          </p>
          <KeepExploring items={meanwhile} />
        </>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((card) => (
            <SeriesCardView key={card.series.id} card={card} />
          ))}
        </div>
      )}

      <Pagination page={result.page} totalPages={result.totalPages} buildHref={(p) => (p === 0 ? "/series" : `/series?page=${p}`)} />
    </div>
  );
}

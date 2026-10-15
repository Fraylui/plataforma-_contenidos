import type { Metadata } from "next";
import { listPublishedSeries } from "@/lib/api/client";
import { Pagination } from "@/components/ui/pagination";
import { SeriesCardView } from "@/components/series/series-cards";

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

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6">
      <header className="mb-6">
        <h1 className="text-title font-bold text-foreground">Series</h1>
        <p className="mt-1 text-sm text-muted">Programas en video y podcast. Elige uno y mira sus episodios.</p>
      </header>

      {result.items.length === 0 ? (
        <p className="rounded-card bg-surface px-4 py-14 text-center text-sm text-muted shadow-card">
          Muy pronto, nuestros primeros programas.
        </p>
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

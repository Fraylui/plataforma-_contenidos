import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { YoutubeLogo } from "@phosphor-icons/react/dist/ssr";
import { getPublishedSeriesBySlug, listSeriesEpisodes, NotFoundError } from "@/lib/api/client";
import { Pagination } from "@/components/ui/pagination";
import { EpisodeCardView, seriesCoverUrl } from "@/components/series/series-cards";
import { ShareButton } from "@/components/series/share-button";

const PAGE_SIZE = 24;

async function load(slug: string) {
  try {
    return await getPublishedSeriesBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/series/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const series = await load(slug);
  return {
    title: series.title,
    description: series.description ?? `Episodios de ${series.title}.`,
    alternates: { canonical: `/series/${series.slug}` },
  };
}

/** Una serie: cabecera con su descripción y los episodios, del más nuevo al más antiguo. */
export default async function SeriesPage({ params, searchParams }: PageProps<"/series/[slug]">) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(0, Number.parseInt(typeof pageParam === "string" ? pageParam : "0", 10) || 0);
  const series = await load(slug);
  const episodes = await listSeriesEpisodes(series.slug, { page, size: PAGE_SIZE });
  const cover = seriesCoverUrl(series.coverImageId, page === 0 ? episodes.items[0] : null);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6">
      <header className="overflow-hidden rounded-card bg-surface shadow-card md:flex">
        {cover && (
          <div className="aspect-video bg-canvas-strong md:w-[45%] md:shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- portada propia o miniatura de YouTube */}
            <img src={cover} alt="" fetchPriority="high" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex flex-col gap-3 p-5 md:p-6">
          {/* Sin antetítulo en mayúsculas (DESIGN.md): tipo y conteo en una línea normal. */}
          <p className="text-sm font-semibold text-accent">
            Serie · {episodes.totalElements} {episodes.totalElements === 1 ? "episodio" : "episodios"}
          </p>
          <h1 className="text-title font-bold break-words text-foreground">{series.title}</h1>
          {series.description && <p className="text-sm whitespace-pre-line text-muted">{series.description}</p>}
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <a
              href={`https://www.youtube.com/playlist?list=${encodeURIComponent(series.youtubePlaylistId)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-accent-fill px-4 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              <YoutubeLogo weight="fill" className="size-4" aria-hidden="true" />
              Ver en YouTube
            </a>
            <ShareButton title={series.title} />
          </div>
        </div>
      </header>

      <h2 className="mt-8 mb-4 text-lg font-bold text-foreground">Episodios</h2>
      {episodes.items.length === 0 ? (
        <p className="rounded-card bg-surface px-4 py-10 text-center text-sm text-muted shadow-card">
          El primer episodio llega muy pronto.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {episodes.items.map((episode) => (
            <EpisodeCardView key={episode.id} seriesSlug={series.slug} episode={episode} />
          ))}
        </div>
      )}

      <Pagination
        page={episodes.page}
        totalPages={episodes.totalPages}
        buildHref={(p) => (p === 0 ? `/series/${series.slug}` : `/series/${series.slug}?page=${p}`)}
      />
    </div>
  );
}

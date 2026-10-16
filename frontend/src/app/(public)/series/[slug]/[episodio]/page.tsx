import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { getPublishedEpisode, NotFoundError } from "@/lib/api/client";
import { formatPublishedDate } from "@/lib/content-labels";
import { YouTubeEmbed } from "@/components/content/youtube-embed";
import { VideoJsonLd } from "@/components/seo/video-json-ld";
import { AdBlock } from "@/components/legal/ad-block";
import { LikeShareBar } from "@/components/content/like-share-bar";
import { ViewBeacon } from "@/components/content/view-beacon";
import { youtubeThumb } from "@/components/series/series-cards";

async function load(seriesSlug: string, episodeSlug: string) {
  try {
    return await getPublishedEpisode(seriesSlug, episodeSlug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

/** Texto plano corto para la descripción de buscadores (las notas son HTML). */
function plainExcerpt(html: string | null, fallback: string | null): string | undefined {
  const text = (html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || fallback?.trim() || "";
  return text ? text.slice(0, 160) : undefined;
}

export async function generateMetadata({ params }: PageProps<"/series/[slug]/[episodio]">): Promise<Metadata> {
  const { slug, episodio } = await params;
  const { series, episode } = await load(slug, episodio);
  return {
    title: `${episode.title} · ${series.title}`,
    description: plainExcerpt(episode.notes, episode.description),
    alternates: { canonical: `/series/${series.slug}/${episode.slug}` },
    openGraph: { images: [youtubeThumb(episode.youtubeVideoId)], type: "video.episode" },
  };
}

/**
 * Un episodio: el video (miniatura primero; el reproductor de YouTube se
 * carga recién al tocar, así la página es liviana), las notas propias del
 * equipo, me gusta, compartir y siguiente/anterior para seguir viendo la serie.
 */
export default async function EpisodePage({ params }: PageProps<"/series/[slug]/[episodio]">) {
  const { slug, episodio } = await params;
  const { series, episode, newer, older, likeCount } = await load(slug, episodio);

  return (
    <article className="mx-auto w-full max-w-[900px] px-4 py-6">
      <VideoJsonLd
        videos={[{ videoId: episode.youtubeVideoId, title: episode.title, caption: null }]}
        fallbackTitle={episode.title}
        description={plainExcerpt(episode.notes, episode.description)}
        uploadDate={episode.publishedAt}
      />

      <YouTubeEmbed videoId={episode.youtubeVideoId} title={episode.title} />

      <header className="mt-5">
        <Link href={`/series/${series.slug}`} className="text-sm font-semibold text-accent hover:underline">
          {series.title}
        </Link>
        <h1 className="mt-1 text-title font-bold text-foreground">{episode.title}</h1>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">{formatPublishedDate(episode.publishedAt)}</p>
          <ViewBeacon type="EPISODE" id={episode.id} />
          <LikeShareBar contentType="episodes" slug={episode.id} initialLikeCount={likeCount} title={episode.title} />
        </div>
      </header>

      {episode.notes ? (
        <div
          className="prose prose-theme mt-6 max-w-none prose-headings:font-bold prose-a:text-accent"
          dangerouslySetInnerHTML={{ __html: episode.notes }}
        />
      ) : (
        episode.description && <p className="mt-6 text-sm whitespace-pre-line text-muted">{episode.description}</p>
      )}

      <div className="mt-8">
        <AdBlock position="article" section="SERIES" categoryId={series.categoryId} layout="band" count={1} />
      </div>

      {(older || newer) && (
        <nav aria-label="Más episodios" className="mt-8 grid gap-3 sm:grid-cols-2">
          {older ? (
            <Link href={`/series/${series.slug}/${older.slug}`} className="flex items-center gap-3 rounded-card bg-surface p-4 shadow-card hover:shadow-pop">
              <CaretLeft className="size-5 shrink-0 text-muted" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-xs text-muted">Anterior</span>
                <span className="block truncate text-sm font-semibold text-foreground">{older.title}</span>
              </span>
            </Link>
          ) : (
            <span className="hidden sm:block" aria-hidden="true" />
          )}
          {newer && (
            <Link href={`/series/${series.slug}/${newer.slug}`} className="flex items-center justify-end gap-3 rounded-card bg-surface p-4 text-right shadow-card hover:shadow-pop">
              <span className="min-w-0">
                <span className="block text-xs text-muted">Siguiente</span>
                <span className="block truncate text-sm font-semibold text-foreground">{newer.title}</span>
              </span>
              <CaretRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}

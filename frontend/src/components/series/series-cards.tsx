import Link from "next/link";
import { Play, Television } from "@phosphor-icons/react/dist/ssr";
import type { Episode, SeriesCard } from "@/lib/api/types";
import { formatPublishedDate } from "@/lib/content-labels";

/** Miniatura de YouTube (la sirve YouTube, nunca el VPS). */
export function youtubeThumb(videoId: string, size: "hq" | "maxres" = "hq"): string {
  return `https://i.ytimg.com/vi/${videoId}/${size === "maxres" ? "maxresdefault" : "hqdefault"}.jpg`;
}

function episodesLabel(count: number): string {
  return `${count} ${count === 1 ? "episodio" : "episodios"}`;
}

/**
 * Portada de una serie en el listado, como en una plataforma de streaming:
 * miniatura 16:9 del último episodio, cantidad de episodios y el último.
 */
export function SeriesCardView({ card }: { card: SeriesCard }) {
  const { series, episodeCount, latestEpisode } = card;
  return (
    <Link
      href={`/series/${series.slug}`}
      className="group flex flex-col overflow-hidden rounded-card bg-surface shadow-card transition-shadow duration-150 hover:shadow-pop focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="relative aspect-video overflow-hidden bg-canvas-strong">
        {latestEpisode ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniatura servida por YouTube (i.ytimg.com)
          <img
            src={youtubeThumb(latestEpisode.youtubeVideoId)}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-muted">
            <Television className="size-10" aria-hidden="true" />
          </span>
        )}
        <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">
          {episodesLabel(episodeCount)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="text-base leading-snug font-bold text-foreground group-hover:text-accent">{series.title}</h2>
        {series.description && <p className="line-clamp-2 text-sm text-muted">{series.description}</p>}
        {latestEpisode && (
          <p className="mt-auto pt-2 text-xs text-muted">
            Último: <span className="font-medium text-foreground">{latestEpisode.title}</span> ·{" "}
            {formatPublishedDate(latestEpisode.publishedAt)}
          </p>
        )}
      </div>
    </Link>
  );
}

/** Episodio en la cuadrícula de una serie: miniatura con botón de reproducir, título y fecha. */
export function EpisodeCardView({ seriesSlug, episode }: { seriesSlug: string; episode: Episode }) {
  return (
    <Link
      href={`/series/${seriesSlug}/${episode.slug}`}
      className="group flex flex-col gap-2 rounded-card focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="relative aspect-video overflow-hidden rounded-card bg-canvas-strong">
        {/* eslint-disable-next-line @next/next/no-img-element -- miniatura servida por YouTube (i.ytimg.com) */}
        <img
          src={youtubeThumb(episode.youtubeVideoId)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
        />
        <span className="absolute inset-0 flex items-center justify-center opacity-90 transition-opacity group-hover:opacity-100">
          <span className="flex size-12 items-center justify-center rounded-full bg-black/60 text-white">
            <Play weight="fill" className="size-6" aria-hidden="true" />
          </span>
        </span>
      </div>
      <div>
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-foreground group-hover:text-accent">{episode.title}</h3>
        <p className="mt-0.5 text-xs text-muted">{formatPublishedDate(episode.publishedAt)}</p>
      </div>
    </Link>
  );
}

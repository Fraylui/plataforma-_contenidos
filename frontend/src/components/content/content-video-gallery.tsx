import type { ContentVideo } from "@/lib/api/types";
import { YouTubeEmbed } from "@/components/content/youtube-embed";
import { MediaCarousel, MediaCaption } from "./media-carousel";

/**
 * Bloque de videos de YouTube de un contenido — mismo criterio que
 * ContentImageGallery: un solo video se muestra fijo, varios se navegan
 * como carrusel (ver MediaCarousel).
 */
export function ContentVideoGallery({ videos, title, spacing = "" }: { videos: ContentVideo[]; title: string; spacing?: string }) {
  if (videos.length === 0) return null;

  if (videos.length === 1) {
    const video = videos[0];
    return (
      <figure className={spacing}>
        <div className="overflow-hidden sm:rounded-2xl">
          <YouTubeEmbed videoId={video.videoId} title={video.title ?? title} />
        </div>
        <MediaCaption title={video.title} caption={video.caption} />
      </figure>
    );
  }

  const captions = videos.map((video) => ({ title: video.title, caption: video.caption }));
  const slides = videos.map((video, index) => (
    <YouTubeEmbed key={video.videoId} videoId={video.videoId} title={video.title ?? `${title} — video ${index + 1}`} />
  ));

  return (
    <MediaCarousel
      spacing={spacing}
      background=""
      slides={slides}
      captions={captions}
      prevLabel="Video anterior"
      nextLabel="Video siguiente"
      dotLabelPrefix="Ir al video"
    />
  );
}

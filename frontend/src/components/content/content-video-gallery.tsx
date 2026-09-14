import type { ContentVideo } from "@/lib/api/types";
import { YouTubeEmbed } from "@/components/article/youtube-embed";
import { MediaCarousel, MediaCaption } from "./media-carousel";

/**
 * Bloque de videos de YouTube de un contenido — mismo criterio que
 * ContentImageGallery: un solo video se muestra fijo, varios se navegan
 * como carrusel (ver MediaCarousel).
 */
export function ContentVideoGallery({ videos, title }: { videos: ContentVideo[]; title: string }) {
  if (videos.length === 0) return null;

  if (videos.length === 1) {
    const video = videos[0];
    return (
      <figure className="my-8">
        <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
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
      spacing="my-8"
      background=""
      slides={slides}
      captions={captions}
      prevLabel="Video anterior"
      nextLabel="Video siguiente"
      dotLabelPrefix="Ir al video"
    />
  );
}

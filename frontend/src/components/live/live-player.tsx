import { YouTubeEmbed } from "@/components/content/youtube-embed";
import { SITE_URL } from "@/lib/site-url";
import type { LiveStream } from "@/lib/api/types";

/**
 * Reproductor de una transmisión dentro del sitio (el video lo sirve
 * YouTube). Mientras está en vivo, en escritorio se muestra al lado el chat
 * de YouTube; en el celular solo el video, para no apretar la pantalla.
 */
export function LivePlayer({ stream }: { stream: LiveStream }) {
  const showChat = stream.status === "LIVE";
  const embedDomain = new URL(SITE_URL).hostname;

  return (
    <div className={showChat ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]" : ""}>
      <YouTubeEmbed videoId={stream.youtubeVideoId} title={stream.title} priority />
      {showChat && (
        <iframe
          src={`https://www.youtube.com/live_chat?v=${encodeURIComponent(stream.youtubeVideoId)}&embed_domain=${encodeURIComponent(embedDomain)}`}
          title={`Chat en vivo: ${stream.title}`}
          loading="lazy"
          className="hidden h-full min-h-[420px] w-full rounded-lg border border-border/60 lg:block"
        />
      )}
    </div>
  );
}

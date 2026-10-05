import type { ContentVideo } from "@/lib/api/types";

/**
 * Marcado VideoObject (schema.org) para cada video de YouTube que trae un
 * contenido: sin esto Google no sabe que la página tiene video y no la
 * muestra en la pestaña/resultados de video. Solo referencia el video y su
 * miniatura en los servidores de YouTube (i.ytimg.com) — nunca una copia
 * propia: la miniatura no está cubierta por la licencia de inserción.
 *
 * `uploadDate` es obligatorio para Google y la API pública de YouTube no
 * llega acá sin una clave; se usa la fecha en que el contenido se publicó
 * en este sitio, que es cuando el video pasó a estar disponible aquí.
 */
export function VideoJsonLd({
  videos,
  fallbackTitle,
  description,
  uploadDate,
}: {
  videos: ContentVideo[];
  fallbackTitle: string;
  description: string | null | undefined;
  uploadDate: string | null;
}) {
  if (videos.length === 0 || !uploadDate) return null;

  const objects = videos.map((video) => ({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title || fallbackTitle,
    description: video.caption || description || video.title || fallbackTitle,
    thumbnailUrl: [`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`],
    uploadDate,
    embedUrl: `https://www.youtube-nocookie.com/embed/${video.videoId}`,
    contentUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
  }));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(objects.length === 1 ? objects[0] : objects).replace(/</g, "\u003c") }}
    />
  );
}

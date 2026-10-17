import type { ContentImage, ContentVideo } from "@/lib/api/types";
import { imageUrl } from "@/lib/image-url";

/** Subida (imagen propia del backend) o enlace externo — nunca ambas, ver ContentImage. */
export function contentImageUrl(image: ContentImage): string | null {
  return image.imageId ? imageUrl(`/api/v1/images/${image.imageId}/file`) : image.externalUrl;
}

/**
 * Imagen al compartir (WhatsApp, Facebook, X) y para Google Discover, la
 * misma regla en los cinco tipos: la elegida a mano en «Cómo se ve al
 * compartir», si no la portada, si no la miniatura del primer video. Es lo
 * que ya muestra la vista previa del panel (share-card.tsx); antes la página
 * pública solo enviaba la elegida a mano y salía sin foto (2026-10-16).
 */
export function shareImageUrl(content: {
  ogImageUrl: string | null;
  images: ContentImage[];
  videos?: ContentVideo[];
}): string | null {
  if (content.ogImageUrl) return content.ogImageUrl;
  const cover = content.images[0] ? contentImageUrl(content.images[0]) : null;
  if (cover) return cover;
  const video = content.videos?.[0];
  return video ? `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg` : null;
}

/**
 * Agrega `max-image-preview:large` a lo indexable: sin esa directiva Google
 * Discover solo muestra miniaturas pequeñas y casi no trae visitas. Lo que
 * el panel marcó `noindex` queda tal cual.
 */
export function robotsWithLargePreview(robots: string): string {
  if (/noindex|max-image-preview/i.test(robots)) return robots;
  return `${robots}, max-image-preview:large`;
}

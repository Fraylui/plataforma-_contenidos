import type { ContentImage, ContentVideo } from "@/lib/api/types";
import { ContentImageGallery } from "@/components/content/content-image-gallery";
import { ContentVideoGallery } from "@/components/content/content-video-gallery";

/**
 * Medio de la vista de post: fotos (una o carrusel) y videos de YouTube,
 * de borde a borde en celular y con esquinas redondeadas desde 640 px. Sin
 * fotos ni videos, bloque de marca con el título (igual que la tarjeta del
 * feed) — nunca un hueco gris. Cuadrado en los tipos visuales; 16:9 en
 * publicaciones, donde manda el texto.
 */
export function PostDetailMedia({
  images,
  videos,
  title,
  aspect = "aspect-square",
}: {
  images: ContentImage[];
  videos: ContentVideo[];
  title: string;
  aspect?: string;
}) {
  if (images.length === 0 && videos.length === 0) {
    return (
      <div
        data-testid="post-detail-fallback"
        className={`flex ${aspect} w-full items-center justify-center bg-linear-to-br from-accent-soft to-canvas-strong p-8 sm:rounded-2xl`}
      >
        <p className="text-center text-2xl leading-tight font-extrabold text-balance text-foreground sm:text-3xl">{title}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ContentImageGallery images={images} alt={title} aspect={aspect} />
      <ContentVideoGallery videos={videos} title={title} />
    </div>
  );
}

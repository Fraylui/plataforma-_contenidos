import type { ComponentProps } from "react";
import type { ContentImage, ContentVideo } from "@/lib/api/types";
import { ContentImageDisplay } from "@/components/content/content-image-display";
import { PreviewImage } from "@/components/ui/preview-image";
import { cn } from "@/lib/utils";
import { PostHeader } from "../post-header";

/** Portada del detalle: foto subida (pasa por next/image) o una URL (enlace externo o miniatura de YouTube). */
export type HeroCover = { kind: "uploaded"; imageId: string } | { kind: "url"; url: string };

/** La primera foto o, si solo hay video, su miniatura de YouTube. */
export function heroCover(images: ContentImage[], videos: ContentVideo[]): HeroCover | null {
  const first = images[0];
  if (first?.imageId) return { kind: "uploaded", imageId: first.imageId };
  if (first?.externalUrl) return { kind: "url", url: first.externalUrl };
  const video = videos[0];
  return video ? { kind: "url", url: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg` } : null;
}

/**
 * Portada inmersiva del detalle (spec 2026-10-21): la foto ocupa la pantalla
 * y el título va encima, sobre un degradado, como una portada de NatGeo o un
 * Reel. Componente de servidor: la foto subida pasa por next/image con
 * prioridad (es el LCP de la página); un enlace externo que no carga deja el
 * degradado oscuro con el título legible, nunca un ícono roto. Sin portada,
 * fondo de acento con el título.
 */
export function ImmersiveHero({
  cover,
  title,
  header,
}: {
  cover: HeroCover | null;
  title: string;
  /** Datos del encabezado (marca, tipo, tema, hora). */
  header: Omit<ComponentProps<typeof PostHeader>, "onImage" | "className">;
}) {
  const photo = cover != null;
  return (
    <div
      className={cn(
        "relative flex h-[70svh] max-h-[640px] min-h-[420px] w-full flex-col justify-end overflow-hidden sm:rounded-card",
        photo ? "bg-canvas-strong" : "bg-linear-to-br from-accent-soft to-canvas-strong",
      )}
    >
      {cover?.kind === "uploaded" && (
        <div className="absolute inset-0">
          <ContentImageDisplay
            image={{ imageId: cover.imageId, externalUrl: null, title: null, caption: null }}
            alt=""
            priority
            sizes="(min-width: 1024px) 760px, 100vw"
            className="object-cover"
          />
        </div>
      )}
      {cover?.kind === "url" && (
        <PreviewImage src={cover.url} priority fallback={null} className="absolute inset-0 size-full object-cover" />
      )}
      {/* Degradado: el texto blanco se lee sobre cualquier foto (y si la foto no cargó). */}
      {photo && <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent" />}
      <div className="relative space-y-3 p-5 sm:p-8">
        <PostHeader {...header} onImage={photo} className="flex items-center gap-3" />
        <h1
          className={cn(
            "text-[clamp(1.75rem,6vw,3rem)] leading-[1.08] font-extrabold tracking-tight text-balance",
            photo ? "text-white [text-shadow:0_1px_12px_rgb(0_0_0/0.35)]" : "text-foreground",
          )}
        >
          {title}
        </h1>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUp } from "@phosphor-icons/react";
import { useEffect } from "react";
import type { StoryView } from "@/lib/api/types";
import { STORY_BACKGROUNDS } from "@/lib/stories/backgrounds";
import { storyLinkHref } from "@/lib/stories/link";
import { cn } from "@/lib/utils";
import { StoryShort } from "./story-short";

const CAPTION_POSITION = {
  TOP: "justify-start pt-24",
  CENTER: "justify-center",
  BOTTOM: "justify-end pb-28",
} as const;

/**
 * Lo que se ve de una historia: foto (o fondo de color) a pantalla, el texto
 * en HTML encima (nítido y legible por lectores de pantalla, no quemado en la
 * imagen) con degradados para el contraste, y la píldora del enlace. `src` es
 * la foto ya resuelta por el servidor. En el compositor del panel se usa
 * estática (`interactive={false}`): sin reloj ni enlaces activos.
 */
export function StoryFrame({
  story,
  src,
  onReady,
  onCta,
  shortPlaying = false,
  onPlayShort,
  interactive = true,
  priority = false,
}: {
  story: Pick<StoryView, "id" | "imageId" | "background" | "caption" | "captionPosition" | "link" | "youtubeVideoId">;
  src?: string | null;
  onReady?: () => void;
  onCta?: () => void;
  shortPlaying?: boolean;
  onPlayShort?: () => void;
  interactive?: boolean;
  priority?: boolean;
}) {
  const photo = Boolean(story.imageId && src);
  useEffect(() => {
    // Sin foto (fondo de color o foto que no se pudo resolver) no hay nada que esperar.
    if (!photo) onReady?.();
  }, [photo, story.id, onReady]);

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-black"
      style={photo ? undefined : { backgroundImage: STORY_BACKGROUNDS[story.background ?? "NIGHT"] }}
    >
      {photo && (
        <Image
          key={story.id}
          src={src!}
          alt={story.caption ?? ""}
          fill
          sizes="(min-width: 1024px) 460px, 100vw"
          priority={priority}
          onLoad={() => onReady?.()}
          onError={() => onReady?.()}
          className="object-cover motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150"
        />
      )}
      {/* Degradados: arriba para las barras y la cabecera, abajo para el texto y los botones (contraste AA). */}
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-black/55 to-transparent" />
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-black/70 to-transparent" />

      {story.caption && (
        // pr-16: no pasar bajo me gusta / compartir; con enlace, el texto de abajo sube sobre la píldora.
        <div
          className={cn(
            "absolute inset-0 flex flex-col pr-16 pl-6",
            CAPTION_POSITION[story.captionPosition],
            story.link && story.captionPosition === "BOTTOM" && "pb-40",
          )}
        >
          <p
            className={cn(
              "text-balance break-words text-white [text-shadow:0_1px_10px_rgb(0_0_0/0.45)]",
              photo ? "text-xl leading-snug font-bold" : "text-center text-[clamp(1.6rem,6.5vw,2.4rem)] leading-tight font-extrabold",
            )}
          >
            {story.caption}
          </p>
        </div>
      )}

      {story.youtubeVideoId && onPlayShort && (
        <StoryShort videoId={story.youtubeVideoId} title={story.caption ?? "Video"} playing={shortPlaying} onPlay={onPlayShort} />
      )}

      {story.link && (
        <div className="absolute inset-x-0 bottom-20 z-10 flex justify-center px-6">
          {interactive ? (
            <Link
              href={storyLinkHref(story.link)}
              aria-label={`${story.link.label}: ${story.link.title}`}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onClick={onCta}
              className="flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-zinc-900 shadow-pop transition-transform active:scale-[0.97]"
            >
              <ArrowUp weight="bold" className="size-4" aria-hidden="true" />
              {story.link.label}
            </Link>
          ) : (
            <span className="flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-zinc-900 shadow-pop">
              <ArrowUp weight="bold" className="size-4" aria-hidden="true" />
              {story.link.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

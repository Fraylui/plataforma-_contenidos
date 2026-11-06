"use client";

import { Play } from "@phosphor-icons/react";

/**
 * Un Short de YouTube dentro de una historia: miniatura con ▶ y el reproductor
 * solo al tocar (youtube-nocookie: nada de YouTube carga antes, igual que en
 * el resto del sitio). Mientras se ve, el visor detiene su reloj.
 */
export function StoryShort({ videoId, title, playing, onPlay }: {
  videoId: string;
  title: string;
  playing: boolean;
  onPlay: () => void;
}) {
  if (playing) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 z-10 h-full w-full bg-black"
      />
    );
  }
  return (
    <button
      type="button"
      // El toque no debe llegar a la tarjeta (sería «historia siguiente»).
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onClick={onPlay}
      aria-label={`Reproducir video: ${title}`}
      className="absolute top-1/2 left-1/2 z-10 flex size-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-transform active:scale-95"
    >
      <Play weight="fill" className="ml-1 size-9" aria-hidden="true" />
    </button>
  );
}

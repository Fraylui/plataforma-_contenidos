"use client";

import { useState } from "react";

/**
 * Patrón "lite embed": no carga el iframe de YouTube (ni sus scripts) hasta
 * que el usuario hace click en la miniatura. Evita el peso inicial de
 * YouTube en cada página de artículo (rendimiento — CONTEXTO.md 43) y usa
 * el dominio -nocookie para no fijar cookies de rastreo antes de que el
 * usuario decida reproducir.
 */
export function YouTubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  const [activated, setActivated] = useState(false);

  if (activated) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActivated(true)}
      className="group relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-black"
      aria-label={`Reproducir video: ${title}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- fuente externa (YouTube), no pasa por next/image */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
      />
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-105">
        <svg viewBox="0 0 20 20" fill="currentColor" className="ml-1 h-7 w-7 text-black" aria-hidden="true">
          <path d="M6.3 4.3a1 1 0 0 1 1.02-.06l8 4.7a1 1 0 0 1 0 1.72l-8 4.7A1 1 0 0 1 6 14.5v-9.4a1 1 0 0 1 .3-.8Z" />
        </svg>
      </span>
    </button>
  );
}

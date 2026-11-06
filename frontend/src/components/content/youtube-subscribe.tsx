"use client";

import { createContext, useContext, type ReactNode } from "react";
import { YoutubeLogo } from "@phosphor-icons/react";

/** Canal oficial de YouTube (Configuración → Redes). Lo pone el layout público una vez. */
const YouTubeChannelContext = createContext<string | null>(null);

export function YouTubeChannelProvider({ url, children }: { url: string | null; children: ReactNode }) {
  return <YouTubeChannelContext.Provider value={url}>{children}</YouTubeChannelContext.Provider>;
}

/**
 * Enlace que abre el canal con la ventana de «Suscribirse» ya abierta
 * (?sub_confirmation=1). Solo para enlaces de canal (/@nombre, /channel/…,
 * /c/…, /user/…); otro tipo de enlace se deja igual.
 */
export function youtubeSubscribeUrl(channelUrl: string): string {
  try {
    const url = new URL(channelUrl);
    if (/^\/(@[^/]+|channel\/[^/]+|c\/[^/]+|user\/[^/]+)\/?$/.test(url.pathname)) {
      url.searchParams.set("sub_confirmation", "1");
    }
    return url.toString();
  } catch {
    return channelUrl;
  }
}

/**
 * Botón «Suscríbete en YouTube» bajo los videos: cada vista y suscripción
 * suma al canal propio (ingreso desde el día 1). Sin canal configurado no se
 * muestra (lo vacío no existe, CONTEXTO.md 43.5).
 */
export function YouTubeSubscribe({ className = "" }: { className?: string }) {
  const channelUrl = useContext(YouTubeChannelContext);
  if (!channelUrl) return null;
  return (
    <a
      href={youtubeSubscribeUrl(channelUrl)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full bg-[#CC0000] px-4 py-2 text-sm font-semibold text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring ${className}`}
    >
      <YoutubeLogo weight="fill" className="size-5" aria-hidden="true" />
      Suscríbete en YouTube
      <span className="sr-only">(se abre en otra pestaña)</span>
    </a>
  );
}

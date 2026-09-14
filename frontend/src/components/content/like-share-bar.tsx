"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Heart, Link as LinkIcon, X } from "lucide-react";
import { getOrCreateVisitorId } from "@/lib/visitor-id";

export type LikeableContentType = "articles" | "places" | "events" | "galleries" | "reviews" | "directory";

const CHANGE_EVENT = "like-share-bar-change";

function likedKey(type: LikeableContentType, slug: string): string {
  return `liked:${type}:${slug}`;
}

/** Dispara CHANGE_EVENT para que useSyncExternalStore reaccione en el mismo tab (el evento "storage" del navegador no se dispara en el tab que hizo el cambio, solo en otros — mismo patrón que lib/cookie-consent.ts). */
function writeLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // localStorage no disponible (modo privado) — guardar/me-gusta-recordado es solo una conveniencia del visitante, no falla la página.
  }
}

function subscribe(listener: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

/**
 * Lee un booleano derivado de localStorage vía useSyncExternalStore en vez
 * de useEffect+setState (mismo motivo que lib/cookie-consent.ts: evita el
 * lint react-hooks/set-state-in-effect y una hidratación con doble render;
 * getServerSnapshot fijo en `false` porque el servidor nunca ve el estado
 * real del visitante, así que empezar en "no" es lo único honesto ahí).
 */
function useLocalStorageFlag(getSnapshot: () => boolean): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/**
 * Estado y acciones de reacción de un contenido, compartidos entre la barra
 * de la página de detalle (LikeShareBar) y las acciones compactas de las
 * tarjetas del home (CardActions). Solo dos reacciones a propósito — sin
 * cuenta de usuario no hay ningún lugar donde mostrarle a alguien su lista
 * de "guardados" después, así que esa tercera reacción no tenía a dónde ir:
 *
 * - "Me gusta" (corazón): real, persistido en el backend y deduplicado por
 *   visitorId anónimo generado en el navegador — ver engagement.ContentLike
 *   y lib/visitor-id.ts. No requiere loguearse: cualquiera puede leer todo
 *   el sitio sin cuenta, y togglear el corazón usa ese mismo visitorId.
 * - "Compartir": Web Share API nativa (hoja de compartir del sistema) con
 *   fallback a copiar el enlace al portapapeles si el navegador no la
 *   soporta (ej. desktop). Nunca persiste nada en el backend.
 *
 * `path` es la ruta del contenido a compartir; sin él se comparte la URL de
 * la página actual (caso de la página de detalle).
 */
export function useContentReactions({
  contentType,
  slug,
  initialLikeCount,
  title,
  path,
}: {
  contentType: LikeableContentType;
  slug: string;
  initialLikeCount: number;
  title: string;
  path?: string;
}) {
  const liked = useLocalStorageFlag(() => localStorage.getItem(likedKey(contentType, slug)) === "1");
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  async function toggleLike() {
    if (pending) return;
    setPending(true);
    const visitorId = getOrCreateVisitorId();
    try {
      const res = await fetch(`/api/content/${contentType}/${encodeURIComponent(slug)}/like?visitorId=${visitorId}`, {
        method: "POST",
      });
      if (res.ok) {
        const result: { liked: boolean; likeCount: number } = await res.json();
        setLikeCount(result.likeCount);
        writeLocalStorage(likedKey(contentType, slug), result.liked ? "1" : "0");
      }
    } finally {
      setPending(false);
    }
  }

  function resolveShareUrl(): string {
    return path ? new URL(path, window.location.origin).toString() : window.location.href;
  }

  async function share() {
    const url = resolveShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // el visitante canceló el diálogo nativo — no es un error a mostrar
      }
      return;
    }
    await copyLink();
  }

  /** Copia el link sin pasar por navigator.share primero — usado por los botones de red específica de LikeShareBar (el share() genérico de CardActions sí prueba el diálogo nativo primero). */
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(resolveShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard bloqueado: no hay nada más que ofrecer sin un diálogo propio
    }
  }

  return { liked, likeCount, pending, copied, toggleLike, share, copyLink, resolveShareUrl };
}

/** Barra de acciones al final del contenido en la página de detalle. */
export function LikeShareBar({
  contentType,
  slug,
  initialLikeCount,
  title,
}: {
  contentType: LikeableContentType;
  slug: string;
  initialLikeCount: number;
  title: string;
}) {
  const { liked, likeCount, pending, copied, toggleLike, copyLink, resolveShareUrl } = useContentReactions({
    contentType,
    slug,
    initialLikeCount,
    title,
  });

  function openNetwork(build: (url: string, title: string) => string) {
    const url = resolveShareUrl();
    window.open(build(url, title), "_blank", "noopener,noreferrer,width=600,height=500");
  }

  return (
    <div className="my-4 flex flex-wrap items-center gap-4 border-y border-border py-3 text-xs font-medium text-muted">
      <button
        type="button"
        onClick={toggleLike}
        disabled={pending}
        aria-pressed={liked}
        className={`inline-flex cursor-pointer items-center gap-1.5 transition-colors hover:text-accent ${liked ? "text-accent" : ""}`}
      >
        <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} aria-hidden="true" />
        <span>{likeCount}</span>
        <span className="sr-only">Me gusta</span>
      </button>

      <span className="h-4 w-px bg-border" aria-hidden="true" />

      <button
        type="button"
        aria-label="Compartir en WhatsApp"
        title="Compartir en WhatsApp"
        onClick={() =>
          openNetwork((url, t) => `https://api.whatsapp.com/send?text=${encodeURIComponent(`${t} ${url}`)}`)
        }
        className="inline-flex cursor-pointer items-center transition-colors hover:text-accent"
      >
        <WhatsAppIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Compartir en Facebook"
        title="Compartir en Facebook"
        onClick={() =>
          openNetwork((url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)
        }
        className="inline-flex cursor-pointer items-center transition-colors hover:text-accent"
      >
        <FacebookIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Compartir en X"
        title="Compartir en X"
        onClick={() =>
          openNetwork(
            (url, t) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(t)}`,
          )
        }
        className="inline-flex cursor-pointer items-center transition-colors hover:text-accent"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex cursor-pointer items-center gap-1.5 transition-colors hover:text-accent"
      >
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <LinkIcon className="h-4 w-4" aria-hidden="true" />}
        {copied ? "Enlace copiado" : "Copiar enlace"}
      </button>
    </div>
  );
}

// lucide-react no trae íconos de marca (solo genéricos) — trazos oficiales
// simplificados, en vez de sumar una librería de íconos aparte por 2 SVGs.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.44 1.27 4.89L2 22l5.25-1.28a9.96 9.96 0 0 0 4.79 1.22h.01c5.52 0 10-4.48 10-10s-4.48-9.94-10.01-9.94Zm0 18.06h-.01a8.4 8.4 0 0 1-4.28-1.17l-.31-.18-3.12.76.76-3.04-.2-.32a8.37 8.37 0 0 1-1.28-4.47c0-4.63 3.77-8.4 8.44-8.4 2.25 0 4.37.88 5.96 2.47a8.36 8.36 0 0 1 2.47 5.95c0 4.63-3.77 8.4-8.43 8.4Zm4.6-6.28c-.25-.13-1.48-.73-1.71-.81-.23-.08-.4-.13-.56.13-.17.25-.65.81-.8.98-.15.17-.29.19-.55.06-.25-.13-1.06-.39-2.02-1.24a7.6 7.6 0 0 1-1.39-1.72c-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.12-.15.16-.25.24-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.83-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08s.89 2.41 1.02 2.58c.13.17 1.75 2.67 4.24 3.75.59.26 1.05.41 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.19-.06-.11-.23-.17-.48-.29Z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14C17.17 2.1 15.98 2 14.71 2 12.06 2 10 3.6 10 6.7v2.8H7v4h3V22h4v-8.5Z" />
    </svg>
  );
}

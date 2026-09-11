"use client";

import { useState, useSyncExternalStore } from "react";
import { Bookmark, Check, Heart, Share2 } from "lucide-react";
import { getOrCreateVisitorId } from "@/lib/visitor-id";

export type LikeableContentType = "articles" | "places" | "events" | "galleries" | "reviews" | "directory";

const CHANGE_EVENT = "like-share-bar-change";

function savedKey(type: LikeableContentType): string {
  return `saved-${type}`;
}

function likedKey(type: LikeableContentType, slug: string): string {
  return `liked:${type}:${slug}`;
}

function readSaved(type: LikeableContentType): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(savedKey(type)) ?? "[]"));
  } catch {
    return new Set();
  }
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
 * tarjetas del home (CardActions): "Me gusta" es real (persistido en el
 * backend, deduplicado por visitorId anónimo — ver engagement.ContentLike);
 * "Guardar" es solo del navegador del lector (localStorage, no hay backend
 * de favoritos todavía); "Compartir" usa Web Share API nativa con fallback
 * de copiar enlace.
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
  const saved = useLocalStorageFlag(() => readSaved(contentType).has(slug));
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

  function toggleSave() {
    const current = readSaved(contentType);
    if (current.has(slug)) {
      current.delete(slug);
    } else {
      current.add(slug);
    }
    writeLocalStorage(savedKey(contentType), JSON.stringify([...current]));
  }

  async function share() {
    const url = path ? new URL(path, window.location.origin).toString() : window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // el visitante canceló el diálogo nativo — no es un error a mostrar
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard bloqueado: no hay nada más que ofrecer sin un diálogo propio
    }
  }

  return { liked, saved, likeCount, pending, copied, toggleLike, toggleSave, share };
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
  const { liked, saved, likeCount, pending, copied, toggleLike, toggleSave, share } = useContentReactions({
    contentType,
    slug,
    initialLikeCount,
    title,
  });

  return (
    <div className="my-4 flex items-center gap-4 border-y border-border py-3 text-xs font-medium text-muted">
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

      <button
        type="button"
        onClick={toggleSave}
        aria-pressed={saved}
        className={`inline-flex cursor-pointer items-center gap-1.5 transition-colors hover:text-accent ${saved ? "text-accent" : ""}`}
      >
        <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} aria-hidden="true" />
        {saved ? "Guardado" : "Guardar"}
      </button>

      <button type="button" onClick={share} className="inline-flex cursor-pointer items-center gap-1.5 transition-colors hover:text-accent">
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
        {copied ? "Enlace copiado" : "Compartir"}
      </button>
    </div>
  );
}

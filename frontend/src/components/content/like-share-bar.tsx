"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Check, Heart, PaperPlaneTilt } from "@phosphor-icons/react";
import { getOrCreateVisitorId } from "@/lib/visitor-id";

export type LikeableContentType = "articles" | "places" | "events" | "galleries" | "directory";

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

/** Píldora de acción del post (Agendar, Cómo llegar, Llamar…): fondo suave, sin borde. */
export const POST_ACTION_PILL =
  "inline-flex min-h-10 items-center gap-1.5 rounded-full bg-canvas-strong px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent-soft hover:text-accent";

/**
 * Barra de acciones de la vista de post, como la de Instagram: corazón (rojo
 * relleno al dar me gusta) con su conteo y avión de papel para compartir; a
 * la derecha, las acciones del tipo que manda la página (`children`). Sin
 * bordes ni cajas.
 */
export function LikeShareBar({
  contentType,
  slug,
  initialLikeCount,
  title,
  children,
}: {
  contentType: LikeableContentType;
  slug: string;
  initialLikeCount: number;
  title: string;
  /** Acciones del tipo (POST_ACTION_PILL), a la derecha de me gusta y compartir. */
  children?: ReactNode;
}) {
  const { liked, likeCount, pending, copied, toggleLike, share } = useContentReactions({
    contentType,
    slug,
    initialLikeCount,
    title,
  });

  return (
    <div className="flex flex-wrap items-center gap-1 py-2">
      <button
        type="button"
        onClick={toggleLike}
        disabled={pending}
        aria-pressed={liked}
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-foreground transition-colors hover:bg-canvas-strong disabled:opacity-60"
      >
        <Heart
          className={`h-7 w-7 transition-transform motion-safe:active:scale-90 ${liked ? "text-red-500" : ""}`}
          weight={liked ? "fill" : "regular"}
          aria-hidden="true"
        />
        <span className="text-[15px] font-semibold tabular-nums">{likeCount}</span>
        <span className="sr-only">Me gusta</span>
      </button>

      <button
        type="button"
        onClick={share}
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-foreground transition-colors hover:bg-canvas-strong"
      >
        {copied ? <Check className="h-7 w-7 text-accent" aria-hidden="true" /> : <PaperPlaneTilt className="h-7 w-7" aria-hidden="true" />}
        <span className={copied ? "text-sm font-semibold" : "sr-only"}>{copied ? "Enlace copiado" : "Compartir"}</span>
      </button>

      {children && <div className="ml-auto flex flex-wrap justify-end gap-2">{children}</div>}
    </div>
  );
}

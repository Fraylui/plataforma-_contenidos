"use client";

import { useEffect, useState } from "react";
import { Bookmark, Check, Heart, Share2 } from "lucide-react";
import { getOrCreateVisitorId } from "@/lib/visitor-id";

const SAVED_KEY = "saved-articles";

function readSaved(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function writeSaved(saved: Set<string>) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify([...saved]));
  } catch {
    // localStorage no disponible (modo privado) — guardar es solo una conveniencia del visitante, no falla la página.
  }
}

/**
 * Barra de acciones bajo los metadatos del artículo: "Me gusta" es real
 * (persistido en el backend, deduplicado por visitorId anónimo — ver
 * ArticleLike); "Guardar" es solo del navegador del lector (localStorage,
 * no hay backend de favoritos todavía); "Compartir" usa Web Share API
 * nativa con fallback de copiar enlace.
 */
export function ArticleActionsBar({
  slug,
  initialLikeCount,
  title,
}: {
  slug: string;
  initialLikeCount: number;
  title: string;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      setLiked(localStorage.getItem(`liked:${slug}`) === "1");
    } catch {
      // sin localStorage: el estado "me gusta" propio no persiste entre visitas, el contador global igual funciona.
    }
    setSaved(readSaved().has(slug));
  }, [slug]);

  async function handleLike() {
    if (pending) return;
    setPending(true);
    const visitorId = getOrCreateVisitorId();
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(slug)}/like?visitorId=${visitorId}`, {
        method: "POST",
      });
      if (res.ok) {
        const result: { liked: boolean; likeCount: number } = await res.json();
        setLiked(result.liked);
        setLikeCount(result.likeCount);
        try {
          localStorage.setItem(`liked:${slug}`, result.liked ? "1" : "0");
        } catch {
          // ver arriba
        }
      }
    } finally {
      setPending(false);
    }
  }

  function handleSave() {
    const current = readSaved();
    if (current.has(slug)) {
      current.delete(slug);
      setSaved(false);
    } else {
      current.add(slug);
      setSaved(true);
    }
    writeSaved(current);
  }

  async function handleShare() {
    const url = window.location.href;
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

  return (
    <div className="my-4 flex items-center gap-4 border-y border-border py-3 text-xs font-medium text-muted">
      <button
        type="button"
        onClick={handleLike}
        disabled={pending}
        aria-pressed={liked}
        className={`inline-flex items-center gap-1.5 transition-colors hover:text-accent ${liked ? "text-accent" : ""}`}
      >
        <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} aria-hidden="true" />
        <span>{likeCount}</span>
        <span className="sr-only">Me gusta</span>
      </button>

      <button
        type="button"
        onClick={handleSave}
        aria-pressed={saved}
        className={`inline-flex items-center gap-1.5 transition-colors hover:text-accent ${saved ? "text-accent" : ""}`}
      >
        <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} aria-hidden="true" />
        {saved ? "Guardado" : "Guardar"}
      </button>

      <button type="button" onClick={handleShare} className="inline-flex items-center gap-1.5 transition-colors hover:text-accent">
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
        {copied ? "Enlace copiado" : "Compartir"}
      </button>
    </div>
  );
}

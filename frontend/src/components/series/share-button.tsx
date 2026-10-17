"use client";

import { useState } from "react";
import { Check, ShareNetwork } from "@phosphor-icons/react";

/** Compartir: diálogo nativo del celular, o copiar el link en escritorio. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // cancelado o no permitido: se copia el link
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // sin portapapeles: no hay nada más que hacer
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-field px-4 text-sm font-semibold text-foreground transition-colors hover:bg-canvas-strong"
    >
      {copied ? <Check weight="bold" className="size-4" aria-hidden="true" /> : <ShareNetwork className="size-4" aria-hidden="true" />}
      {copied ? "Link copiado" : "Compartir"}
    </button>
  );
}

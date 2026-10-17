import type { ReactNode } from "react";
import { Megaphone } from "@phosphor-icons/react/dist/ssr";

/**
 * Anuncio del feed con forma de post, como los de Instagram o Facebook:
 * misma superficie que una publicación, encabezado "Patrocinado" (la
 * etiqueta que piden Google y la IAB, fuera de la creatividad) y el banner
 * debajo. Sin marco de color. Solo se dibuja cuando hay anuncio (ver
 * AdBlockClient `frame="post"`); si AdSense no llena el espacio, se oculta
 * entero.
 */
export function SponsoredPost({ children }: { children: ReactNode }) {
  return (
    <article
      aria-label="Patrocinado"
      className="bg-surface pb-3 has-[ins[data-ad-status=unfilled]]:hidden sm:rounded-2xl"
    >
      <header className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas-strong text-muted">
          <Megaphone className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold text-foreground">Patrocinado</span>
      </header>
      <div className="px-4">{children}</div>
    </article>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useMounted } from "@/lib/use-mounted";

const DISMISS_KEY = "anchor-ad-dismissed";

/**
 * Barra flotante pegada abajo de la pantalla, con botón de cierre — la
 * versión propia del "Anchor ad" de Google Auto ads (ver AdsenseLoader),
 * pero para campañas directas vendidas en la posición `anchor`. A
 * diferencia de los banners normales (que van dentro del flujo del
 * contenido), esta SÍ necesita X: tapa contenido todo el tiempo mientras
 * el visitante hace scroll, así que tiene que poder cerrarse.
 *
 * Se monta con un portal a `document.body` (no inline donde se use el
 * componente) por el mismo motivo que MobileNav: cualquier ancestro con
 * `backdrop-filter`/`filter`/`transform` (o un simulador de dispositivo del
 * navegador) puede convertir el `position: fixed` en "fijo respecto a ese
 * ancestro" en vez de la pantalla — visto en captura real, la barra flotante
 * quedaba encajada como una tarjeta más del listado en vez de flotar abajo.
 *
 * Recibe el banner como `children`: este componente solo aporta la barra
 * flotante y el cierre. `width` es la medida de la creatividad (320×50, el
 * banner móvil estándar): la barra se ajusta a ella en vez de estirarla.
 *
 * El cierre se guarda en sessionStorage (no localStorage): vuelve a
 * aparecer en la próxima visita, pero no reaparece en cada página mientras
 * el visitante sigue navegando la misma sesión — igual que hace Google.
 */
export function StickyAnchorAd({ children, width }: { children: ReactNode; width: number }) {
  const mounted = useMounted();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (!mounted || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Almacenamiento bloqueado (navegación privada, etc.) — igual se oculta para esta página.
    }
  }

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 sm:px-4">
      <div
        className="relative w-full rounded-xl border border-border bg-surface px-2 pt-1.5 pb-2 shadow-lg"
        style={{ maxWidth: width + 16 }}
      >
        {children}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar anuncio"
          className="absolute -top-2.5 -right-2.5 flex h-6 w-6 items-center justify-center rounded-full border border-foreground/10 bg-surface text-foreground shadow-md transition-colors hover:bg-canvas"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body
  );
}

"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { getCookieConsent, subscribeToCookieConsent } from "@/lib/cookie-consent";

const getServerSnapshot = () => null;

/**
 * Unidad de anuncio de AdSense (CONTEXTO.md sección 43.2: posiciones de
 * anuncio mediante slots configurables, no hardcodeadas). Solo se monta si
 * ya hay consentimiento de cookies aceptado — mismo criterio que
 * AdsenseLoader, que es quien inyecta el script `adsbygoogle` del que este
 * componente depende. No renderiza nada mientras no haya slot configurado
 * (ver AdBlock, que es quien decide eso desde platformSettings).
 */
export function AdSlot({ clientId, slot, className }: { clientId: string; slot: string; className?: string }) {
  const consent = useSyncExternalStore(subscribeToCookieConsent, getCookieConsent, getServerSnapshot);
  const pushed = useRef(false);

  useEffect(() => {
    if (consent !== "accepted" || pushed.current) return;
    try {
      const w = window as typeof window & { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // El script de AdSense puede no haber cargado (bloqueador, red) — no debe romper la página.
    }
  }, [consent]);

  if (consent !== "accepted") return null;

  return (
    <ins
      className={`adsbygoogle block${className ? ` ${className}` : ""}`}
      style={{ display: "block" }}
      data-ad-client={clientId}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

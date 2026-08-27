"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { getCookieConsent, subscribeToCookieConsent } from "@/lib/cookie-consent";

const getServerSnapshot = () => null;

/**
 * Inyecta el script de Google AdSense solo si el visitante ya aceptó
 * cookies (ver components/legal/cookie-consent-banner.tsx) — nunca antes.
 * `clientId` es platformSettings.adsenseClientId ("ca-pub-XXXXXXXXXXXXXXXX"),
 * ya validado por el caller (adsenseEnabled && clientId no vacío).
 */
export function AdsenseLoader({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const consent = useSyncExternalStore(subscribeToCookieConsent, getCookieConsent, getServerSnapshot);

  // El panel admin no muestra anuncios — no tiene sentido cargar el script
  // ahí (ver mismo comentario en cookie-consent-banner.tsx).
  if (pathname?.startsWith("/admin")) return null;
  if (consent !== "accepted") return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

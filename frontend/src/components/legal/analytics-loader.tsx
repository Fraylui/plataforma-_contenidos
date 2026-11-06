"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";
import { getCookieConsent, subscribeToCookieConsent } from "@/lib/cookie-consent";

const getServerSnapshot = () => null;
/** Un ID de medición de Google Analytics 4; cualquier otra cosa no se inyecta en el script. */
const MEASUREMENT_ID = /^G-[A-Z0-9]+$/;

/**
 * Google Analytics solo con permiso (Ley 29733 y el propio aviso de cookies:
 * «si sumamos analítica de terceros, te lo vamos a preguntar»). Antes se
 * cargaba desde el layout raíz para todos, incluso en el panel.
 */
export function AnalyticsLoader({ measurementId }: { measurementId: string | null }) {
  const consent = useSyncExternalStore(subscribeToCookieConsent, getCookieConsent, getServerSnapshot);
  if (consent !== "accepted" || !measurementId || !MEASUREMENT_ID.test(measurementId)) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="analytics-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}');`}
      </Script>
    </>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import { StickyAnchorAd } from "@/components/legal/sticky-anchor-ad";
import { DirectCampaignBanner } from "@/components/legal/direct-campaign-banner";
import { usePlannedCampaign } from "@/components/legal/use-ad-rotation";
import { getCookieConsent, subscribeToCookieConsent } from "@/lib/cookie-consent";
import { usePathname } from "next/navigation";
import { sectionFromPath } from "@/lib/ads/ad-context";

const getServerSnapshot = () => null;

/**
 * Punto de inserción sitewide para el anchor ad propio (ver StickyAnchorAd)
 * — vive en el layout público, no en cada página, igual que AdsenseLoader:
 * si no hay una campaña vendida para `anchor`, no renderiza nada (no hay
 * fallback a AdSense acá, ese ya tiene su propio anchor ad nativo). La
 * campaña se pide desde el navegador: si se pidiera al renderizar, todo el
 * sitio público dejaría de ser cacheable (ver app/api/ads/campaign/route.ts).
 *
 * Espera a que el visitante responda el aviso de cookies (aceptar o
 * rechazar, da igual: esta barra no usa cookies): los dos van fijos abajo y
 * la barra quedaba tapada detrás del aviso — y contando vistas que nadie
 * veía, porque IntersectionObserver no detecta lo que tapa otro elemento.
 */
export function AnchorAdSlot() {
  const consent = useSyncExternalStore(subscribeToCookieConsent, getCookieConsent, getServerSnapshot);
  const section = sectionFromPath(usePathname());
  const planned = usePlannedCampaign("anchor", 0, consent !== null, { section });
  if (!planned?.campaign) return null;
  const { rotation, campaign } = planned;
  return (
    <StickyAnchorAd width={rotation.width}>
      <DirectCampaignBanner campaign={campaign} width={rotation.width} height={rotation.height} />
    </StickyAnchorAd>
  );
}

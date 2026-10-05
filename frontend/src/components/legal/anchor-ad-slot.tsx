"use client";

import { StickyAnchorAd } from "@/components/legal/sticky-anchor-ad";
import { DirectCampaignBanner } from "@/components/legal/direct-campaign-banner";
import { useDirectCampaign } from "@/components/legal/use-direct-campaign";

/**
 * Punto de inserción sitewide para el anchor ad propio (ver StickyAnchorAd)
 * — vive en el layout público, no en cada página, igual que AdsenseLoader:
 * si no hay una campaña vendida para `anchor`, no renderiza nada (no hay
 * fallback a AdSense acá, ese ya tiene su propio anchor ad nativo). La
 * campaña se pide desde el navegador: si se pidiera al renderizar, todo el
 * sitio público dejaría de ser cacheable (ver app/api/ads/campaign/route.ts).
 */
export function AnchorAdSlot() {
  const campaign = useDirectCampaign("anchor");
  if (!campaign) return null;
  return (
    <StickyAnchorAd>
      <DirectCampaignBanner campaign={campaign} className="aspect-[5/1] shadow-lg" />
    </StickyAnchorAd>
  );
}

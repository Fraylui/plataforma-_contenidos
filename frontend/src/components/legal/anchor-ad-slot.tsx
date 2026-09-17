import { getActiveCampaign } from "@/lib/api/client";
import { StickyAnchorAd } from "@/components/legal/sticky-anchor-ad";
import { DirectCampaignBanner } from "@/components/legal/direct-campaign-banner";

/**
 * Punto de inserción sitewide para el anchor ad propio (ver StickyAnchorAd)
 * — vive en el layout público, no en cada página, igual que AdsenseLoader:
 * si no hay una campaña vendida para `anchor`, no renderiza nada (no hay
 * fallback a AdSense acá, ese ya tiene su propio anchor ad nativo).
 */
export async function AnchorAdSlot() {
  const campaign = await getActiveCampaign("anchor");
  if (!campaign) return null;
  return (
    <StickyAnchorAd>
      <DirectCampaignBanner campaign={campaign} className="aspect-[5/1] shadow-lg" />
    </StickyAnchorAd>
  );
}

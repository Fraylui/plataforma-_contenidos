"use client";

import { AdSlot } from "@/components/legal/ad-slot";
import { DirectCampaignBanner } from "@/components/legal/direct-campaign-banner";
import { useDirectCampaign } from "@/components/legal/use-direct-campaign";

/**
 * Mitad cliente de AdBlock: primero pregunta si hay campaña directa para la
 * posición; si no hay, cae a la unidad de AdSense (si está configurada).
 * Mientras pregunta no muestra nada — la pauta nunca debe empujar el
 * contenido con un placeholder vacío cuando al final no hay anuncio.
 */
export function AdBlockClient({
  position,
  className,
  adsense,
}: {
  position: string;
  className?: string;
  adsense: { clientId: string; slot: string } | null;
}) {
  const campaign = useDirectCampaign(position);
  if (campaign === undefined) return null;
  if (campaign) return <DirectCampaignBanner campaign={campaign} className={className} />;
  if (!adsense) return null;
  return <AdSlot clientId={adsense.clientId} slot={adsense.slot} className={className} />;
}

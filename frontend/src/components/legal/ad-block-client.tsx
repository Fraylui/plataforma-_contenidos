"use client";

import { AdSlot } from "@/components/legal/ad-slot";
import { DirectCampaignBanner } from "@/components/legal/direct-campaign-banner";
import { usePlannedCampaign } from "@/components/legal/use-ad-rotation";

/**
 * Mitad cliente de AdBlock: primero las campañas directas de la posición;
 * si no hay una para este espacio, cae a la unidad de AdSense (si está
 * configurada). Mientras pregunta no muestra nada — la pauta nunca debe
 * dejar un hueco vacío cuando al final no hay anuncio.
 *
 * `slot`: índice del espacio dentro de la página para esta posición (el
 * feed del home repite "en-feed"). El reparto de la página (page-ad-plan)
 * le da a cada uno otra campaña y, si se puede, otro anunciante; si hay más
 * espacios que campañas, los sobrantes van a AdSense o quedan vacíos.
 */
export function AdBlockClient({
  position,
  slot = 0,
  className,
  adsense,
}: {
  position: string;
  slot?: number;
  className?: string;
  adsense: { clientId: string; slot: string } | null;
}) {
  const planned = usePlannedCampaign(position, slot);
  if (planned === undefined) return null;
  if (planned?.campaign) {
    const { rotation, campaign } = planned;
    return <DirectCampaignBanner campaign={campaign} width={rotation.width} height={rotation.height} className={className} />;
  }
  if (!adsense) return null;
  return <AdSlot clientId={adsense.clientId} slot={adsense.slot} className={className} />;
}

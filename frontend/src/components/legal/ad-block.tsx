import { getActiveCampaign, getPlatformSettings, listActiveAdPlacements } from "@/lib/api/client";
import { AdSlot } from "@/components/legal/ad-slot";
import { DirectCampaignBanner } from "@/components/legal/direct-campaign-banner";

/**
 * Punto de inserción de anuncios listo para usar en cualquier página
 * pública: `<AdBlock position="article" />`. `position` es la `key` de una
 * posición creada en Configuración → Publicidad (módulo `advertising`, ver
 * AdPlacement.java) — agregar una posición nueva no requiere tocar este
 * componente, solo crearla en el admin y usar su key acá.
 *
 * Antes de caer a AdSense, consulta si hay una campaña de publicidad directa
 * vendida para esta posición (Anunciantes → Campañas) y la muestra en su
 * lugar — cero cambio de comportamiento donde no se vendió nada directo.
 */
export async function AdBlock({ position, className }: { position: string; className?: string }) {
  const activeCampaign = await getActiveCampaign(position);
  if (activeCampaign) {
    return <DirectCampaignBanner campaign={activeCampaign} className={className} />;
  }

  const settings = await getPlatformSettings();
  if (!settings.adsenseEnabled || !settings.adsenseClientId) return null;

  const placements = await listActiveAdPlacements();
  const placement = placements.find((p) => p.key === position);
  if (!placement?.adsenseSlotId) return null;

  return <AdSlot clientId={settings.adsenseClientId} slot={placement.adsenseSlotId} className={className} />;
}
